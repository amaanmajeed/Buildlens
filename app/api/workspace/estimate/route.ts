import { isAuthError, requireUser } from "@/lib/auth";
import type { EstimateRow } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const auth = await requireUser();
    if (isAuthError(auth)) return auth;
    const { supabase, user } = auth;

    const projectIdRaw = new URL(request.url).searchParams.get("projectId");
    const projectId = projectIdRaw ? Number(projectIdRaw) : NaN;
    if (!Number.isFinite(projectId)) {
      return Response.json(
        { error: "projectId is required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("estimate_drafts")
      .select("*")
      .eq("user_id", user.id)
      .eq("project_id", projectId)
      .maybeSingle();
    if (error) throw error;

    return Response.json({
      projectId,
      estimateRows: Array.isArray(data?.estimate_rows) ? data.estimate_rows : [],
      projectTitle: data?.project_title ?? null,
    });
  } catch (e) {
    console.error("[api/workspace/estimate GET]", e);
    return Response.json({ error: "Could not load estimate." }, { status: 502 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireUser();
    if (isAuthError(auth)) return auth;
    const { supabase, user } = auth;

    const body = await request.json();
    const projectId =
      typeof body?.projectId === "number"
        ? body.projectId
        : Number(body?.projectId);
    if (!Number.isFinite(projectId)) {
      return Response.json(
        { error: "projectId is required." },
        { status: 400 }
      );
    }
    if (!Array.isArray(body?.estimateRows)) {
      return Response.json(
        { error: "estimateRows array is required." },
        { status: 400 }
      );
    }

    const rows = body.estimateRows as EstimateRow[];
    const { data, error } = await supabase
      .from("estimate_drafts")
      .upsert(
        {
          user_id: user.id,
          project_id: projectId,
          project_title:
            typeof body?.projectTitle === "string" ? body.projectTitle : null,
          estimate_rows: rows,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,project_id" }
      )
      .select("*")
      .single();
    if (error) throw error;

    return Response.json({
      projectId: data.project_id,
      estimateRows: data.estimate_rows,
    });
  } catch (e) {
    console.error("[api/workspace/estimate PUT]", e);
    return Response.json({ error: "Could not save estimate." }, { status: 502 });
  }
}
