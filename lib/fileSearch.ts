import { GoogleGenAI } from "@google/genai";
import { DEFAULT_GEMINI_MODEL, parseGeminiModelId } from "@/lib/geminiModels";
import { getSupabase } from "@/lib/supabase";

const STORE_DISPLAY_NAME = "buildlens-specs";

export type FileSearchDocRow = {
  id: string;
  file_key: string;
  project_id: number;
  project_title: string;
  file_name: string;
  store_name: string;
  document_name: string | null;
  display_name: string | null;
};

function getApiKey(): string {
  const key = (
    process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY
  )?.trim();
  if (!key) throw new Error("missing_api_key");
  return key;
}

function getAi(): GoogleGenAI {
  return new GoogleGenAI({ apiKey: getApiKey() });
}

async function resolveStoreName(ai: GoogleGenAI): Promise<string> {
  const pager = await ai.fileSearchStores.list({ config: { pageSize: 20 } });
  for await (const store of pager) {
    if (store.displayName === STORE_DISPLAY_NAME && store.name) {
      return store.name;
    }
  }
  const created = await ai.fileSearchStores.create({
    config: { displayName: STORE_DISPLAY_NAME },
  });
  if (!created.name) throw new Error("file_search_store_create_failed");
  return created.name;
}

function pdfBase64ToBlob(pdfBase64: string): Blob {
  const buf = Buffer.from(pdfBase64, "base64");
  return new Blob([new Uint8Array(buf)], { type: "application/pdf" });
}

async function pollUpload(
  ai: GoogleGenAI,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SDK Operation type
  operation: any
): Promise<{ documentName?: string }> {
  let op = operation;
  for (let i = 0; i < 120; i++) {
    if (op.done) {
      if (op.error) {
        throw new Error(
          `file_search_upload_failed: ${JSON.stringify(op.error)}`
        );
      }
      return {
        documentName:
          typeof op.response?.documentName === "string"
            ? op.response.documentName
            : undefined,
      };
    }
    await new Promise((r) => setTimeout(r, 2000));
    op = await ai.operations.get({ operation: op });
  }
  throw new Error("file_search_upload_timeout");
}

export async function lookupFileSearchDoc(
  fileKey: string
): Promise<FileSearchDocRow | null> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("file_search_docs")
    .select("*")
    .eq("file_key", fileKey)
    .maybeSingle();
  if (error) throw error;
  return data as FileSearchDocRow | null;
}

export async function listFileSearchDocs(
  projectId: number
): Promise<FileSearchDocRow[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("file_search_docs")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as FileSearchDocRow[];
}

export type EnsureIndexedInput = {
  fileKey: string;
  projectId: number;
  projectTitle: string;
  fileName: string;
  pdfBase64?: string;
  displayName?: string;
};

export type EnsureIndexedResult = {
  storeName: string;
  documentName: string | null;
  fileKey: string;
  reused: boolean;
};

export async function ensureIndexed(
  input: EnsureIndexedInput
): Promise<EnsureIndexedResult> {
  const existing = await lookupFileSearchDoc(input.fileKey);
  if (existing) {
    return {
      storeName: existing.store_name,
      documentName: existing.document_name,
      fileKey: existing.file_key,
      reused: true,
    };
  }

  if (!input.pdfBase64) {
    throw new Error("pdf_required_for_first_index");
  }

  const ai = getAi();
  const storeName = await resolveStoreName(ai);
  const displayName = input.displayName ?? input.fileName;

  const operation = await ai.fileSearchStores.uploadToFileSearchStore({
    fileSearchStoreName: storeName,
    file: pdfBase64ToBlob(input.pdfBase64),
    config: {
      mimeType: "application/pdf",
      displayName,
      customMetadata: [{ key: "file_key", stringValue: input.fileKey }],
    },
  });

  const finished = await pollUpload(ai, operation);
  const documentName = finished.documentName ?? null;

  const sb = getSupabase();
  const { error } = await sb.from("file_search_docs").upsert(
    {
      file_key: input.fileKey,
      project_id: input.projectId,
      project_title: input.projectTitle,
      file_name: input.fileName,
      store_name: storeName,
      document_name: documentName,
      display_name: displayName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "file_key" }
  );
  if (error) throw error;

  return {
    storeName,
    documentName,
    fileKey: input.fileKey,
    reused: false,
  };
}

export async function generateWithFileSearch(
  storeName: string,
  fileKey: string,
  textPrompt: string,
  modelId: unknown = DEFAULT_GEMINI_MODEL
): Promise<string> {
  const ai = getAi();
  const model = parseGeminiModelId(modelId);
  // Escape double quotes in file_key for the filter expression
  const safeKey = fileKey.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const response = await ai.models.generateContent({
    model,
    contents: textPrompt,
    config: {
      tools: [
        {
          fileSearch: {
            fileSearchStoreNames: [storeName],
            metadataFilter: `file_key="${safeKey}"`,
          },
        },
      ],
    },
  });
  const out = response.text;
  if (!out?.trim()) throw new Error("empty_response");
  return out;
}
