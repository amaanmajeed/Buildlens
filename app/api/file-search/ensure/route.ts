import { ensureIndexed } from "@/lib/fileSearch";
import { isAuthError, requireUser } from "@/lib/auth";
import {
  makeFileKey,
  makeManualFileKey,
  shortContentHash,
} from "@/lib/fileKey";
import { resolveOpenAiApiKey } from "@/lib/userOpenAiKey";
import { supabasePublicConfigured } from "@/lib/supabaseEnv";

export async function POST(request: Request) {
  try {
    if (!supabasePublicConfigured()) {
      return Response.json(
        { error: "Supabase is not configured.", code: "MISSING_SUPABASE" },
        { status: 500 }
      );
    }

    const auth = await requireUser();
    if (isAuthError(auth)) return auth;
    const { supabase, user } = auth;

    const body = await request.json();
    const fileName =
      typeof body?.fileName === "string" ? body.fileName.trim() : "";
    const projectTitle =
      typeof body?.projectTitle === "string" ? body.projectTitle.trim() : "";
    const pdfBase64 =
      typeof body?.pdfBase64 === "string" ? body.pdfBase64 : undefined;
    const projectIdRaw = body?.projectId;
    const projectId =
      typeof projectIdRaw === "number"
        ? projectIdRaw
        : typeof projectIdRaw === "string" && projectIdRaw.trim()
          ? Number(projectIdRaw)
          : NaN;

    if (!fileName) {
      return Response.json({ error: "fileName is required." }, { status: 400 });
    }

    let fileKey: string;
    let resolvedProjectId: number;
    let resolvedTitle: string;

    if (Number.isFinite(projectId)) {
      fileKey =
        typeof body?.fileKey === "string" && body.fileKey.trim()
          ? body.fileKey.trim()
          : makeFileKey(projectId, fileName);
      resolvedProjectId = projectId;
      resolvedTitle = projectTitle || `Project ${projectId}`;
    } else {
      const hash = pdfBase64 ? shortContentHash(pdfBase64) : undefined;
      fileKey =
        typeof body?.fileKey === "string" && body.fileKey.trim()
          ? body.fileKey.trim()
          : makeManualFileKey(fileName, hash);
      resolvedProjectId = 0;
      resolvedTitle = projectTitle || "Manual upload";
    }

    const openaiApiKey = await resolveOpenAiApiKey(supabase, user.id);

    const result = await ensureIndexed(supabase, {
      fileKey,
      projectId: resolvedProjectId,
      projectTitle: resolvedTitle,
      fileName,
      pdfBase64,
      displayName: fileName,
      userId: user.id,
      openaiApiKey,
    });

    return Response.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "pdf_required_for_first_index") {
      return Response.json(
        {
          error: "PDF bytes are required the first time this file is indexed.",
          code: "PDF_REQUIRED",
        },
        { status: 400 }
      );
    }
    if (msg === "missing_openai_api_key") {
      return Response.json(
        {
          error:
            "Add your OpenAI API key in Settings before indexing documents.",
          code: "MISSING_USER_OPENAI_KEY",
        },
        { status: 400 }
      );
    }
    if (msg === "missing_encryption_key" || msg === "invalid_encryption_key") {
      return Response.json(
        {
          error: "Server encryption is not configured.",
          code: "MISSING_ENCRYPTION_KEY",
        },
        { status: 500 }
      );
    }
    console.error("[api/file-search/ensure]", e);
    return Response.json(
      { error: "Could not index document.", code: "ENSURE_FAILED" },
      { status: 502 }
    );
  }
}
