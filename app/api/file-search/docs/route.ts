import { listFileSearchDocs } from "@/lib/fileSearch";
import { isAuthError, requireUser } from "@/lib/auth";
import { supabasePublicConfigured } from "@/lib/supabaseEnv";

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const projectIdRaw = searchParams.get("projectId");
    const projectId = projectIdRaw ? Number(projectIdRaw) : NaN;
    if (!Number.isFinite(projectId)) {
      return Response.json(
        { error: "projectId is required." },
        { status: 400 }
      );
    }

    const docs = await listFileSearchDocs(supabase, user.id, projectId);
    return Response.json({
      docs: docs.map((d) => ({
        fileKey: d.file_key,
        fileName: d.file_name,
        storeName: d.store_name,
        documentName: d.document_name,
        projectTitle: d.project_title,
        displayName: d.display_name,
      })),
    });
  } catch (e) {
    console.error("[api/file-search/docs]", e);
    return Response.json(
      { error: "Could not load indexed documents." },
      { status: 502 }
    );
  }
}
