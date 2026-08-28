import OpenAI, { toFile } from "openai";
import { DEFAULT_AI_MODEL } from "@/lib/aiModels";
import type { SupabaseClient } from "@supabase/supabase-js";

const STORE_NAME = "buildlens-specs";

export type FileSearchDocRow = {
  id: string;
  file_key: string;
  project_id: number;
  project_title: string;
  file_name: string;
  store_name: string;
  document_name: string | null;
  display_name: string | null;
  user_id?: string;
};

function isOpenAiStore(storeName: string): boolean {
  return storeName.startsWith("vs_");
}

async function resolveVectorStoreId(openai: OpenAI): Promise<string> {
  for await (const store of openai.vectorStores.list({ limit: 100 })) {
    if (store.name === STORE_NAME) return store.id;
  }
  const created = await openai.vectorStores.create({ name: STORE_NAME });
  return created.id;
}

export async function lookupFileSearchDoc(
  sb: SupabaseClient,
  userId: string,
  fileKey: string
): Promise<FileSearchDocRow | null> {
  const { data, error } = await sb
    .from("file_search_docs")
    .select("*")
    .eq("user_id", userId)
    .eq("file_key", fileKey)
    .maybeSingle();
  if (error) throw error;
  return data as FileSearchDocRow | null;
}

export async function listFileSearchDocs(
  sb: SupabaseClient,
  userId: string,
  projectId: number
): Promise<FileSearchDocRow[]> {
  const { data, error } = await sb
    .from("file_search_docs")
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as FileSearchDocRow[]).filter((d) =>
    isOpenAiStore(d.store_name)
  );
}

export type EnsureIndexedInput = {
  fileKey: string;
  projectId: number;
  projectTitle: string;
  fileName: string;
  pdfBase64?: string;
  displayName?: string;
  userId: string;
  openaiApiKey: string;
};

export type EnsureIndexedResult = {
  storeName: string;
  documentName: string | null;
  fileKey: string;
  reused: boolean;
};

export async function ensureIndexed(
  sb: SupabaseClient,
  input: EnsureIndexedInput
): Promise<EnsureIndexedResult> {
  const existing = await lookupFileSearchDoc(sb, input.userId, input.fileKey);
  if (existing && isOpenAiStore(existing.store_name)) {
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

  const openai = new OpenAI({ apiKey: input.openaiApiKey });
  const storeName = await resolveVectorStoreId(openai);
  const displayName = input.displayName ?? input.fileName;
  const buf = Buffer.from(input.pdfBase64, "base64");

  const uploaded = await openai.files.create({
    file: await toFile(buf, displayName, { type: "application/pdf" }),
    purpose: "assistants",
  });

  const vsFile = await openai.vectorStores.files.createAndPoll(storeName, {
    file_id: uploaded.id,
    attributes: { file_key: input.fileKey },
  });

  if (vsFile.status === "failed") {
    throw new Error(
      `file_search_upload_failed: ${JSON.stringify(vsFile.last_error)}`
    );
  }

  const { error } = await sb.from("file_search_docs").upsert(
    {
      user_id: input.userId,
      file_key: input.fileKey,
      project_id: input.projectId,
      project_title: input.projectTitle,
      file_name: input.fileName,
      store_name: storeName,
      document_name: uploaded.id,
      display_name: displayName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,file_key" }
  );
  if (error) throw error;

  return {
    storeName,
    documentName: uploaded.id,
    fileKey: input.fileKey,
    reused: false,
  };
}

export async function generateWithFileSearch(
  openaiApiKey: string,
  storeName: string,
  fileKey: string,
  textPrompt: string
): Promise<string> {
  const openai = new OpenAI({ apiKey: openaiApiKey });
  const response = await openai.responses.create({
    model: DEFAULT_AI_MODEL,
    input: textPrompt,
    tools: [
      {
        type: "file_search",
        vector_store_ids: [storeName],
        filters: {
          type: "eq",
          key: "file_key",
          value: fileKey,
        },
      },
    ],
  });
  const out = response.output_text;
  if (!out?.trim()) throw new Error("empty_response");
  return out;
}
