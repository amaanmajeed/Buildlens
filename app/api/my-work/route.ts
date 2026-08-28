import { isAuthError, requireUser } from "@/lib/auth";
import type { PortalProject, ProjectFile } from "@/lib/scraper";

export async function GET() {
  try {
    const auth = await requireUser();
    if (isAuthError(auth)) return auth;
    const { supabase, user } = auth;

    const { data: projects, error } = await supabase
      .from("user_projects")
      .select("*")
      .eq("user_id", user.id)
      .order("last_opened_at", { ascending: false });
    if (error) throw error;

    const rows = projects ?? [];
    const enriched = await Promise.all(
      rows.map(async (p) => {
        const projectId = p.project_id as number;
        const [{ count: estimateCount }, { count: snapCount }, { count: docCount }] =
          await Promise.all([
            supabase
              .from("estimate_drafts")
              .select("*", { count: "exact", head: true })
              .eq("user_id", user.id)
              .eq("project_id", projectId),
            supabase
              .from("workspace_snapshots")
              .select("*", { count: "exact", head: true })
              .eq("user_id", user.id)
              .eq("project_id", projectId),
            supabase
              .from("file_search_docs")
              .select("*", { count: "exact", head: true })
              .eq("user_id", user.id)
              .eq("project_id", projectId),
          ]);

        return {
          projectId,
          projectTitle: p.project_title as string,
          projectMeta: p.project_meta ?? {},
          files: Array.isArray(p.files) ? p.files : [],
          lastOpenedAt: p.last_opened_at as string,
          hasEstimate: (estimateCount ?? 0) > 0,
          hasWorkspace: (snapCount ?? 0) > 0,
          hasIndexedDocs: (docCount ?? 0) > 0,
        };
      })
    );

    return Response.json({ projects: enriched });
  } catch (e) {
    console.error("[api/my-work GET]", e);
    return Response.json({ error: "Could not load My Work." }, { status: 502 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireUser();
    if (isAuthError(auth)) return auth;
    const { supabase, user } = auth;

    const body = await request.json();
    const project = body?.project as PortalProject | undefined;
    if (!project || typeof project.id !== "number" || !project.title) {
      return Response.json(
        { error: "project with id and title is required." },
        { status: 400 }
      );
    }

    const files = Array.isArray(body?.files)
      ? (body.files as ProjectFile[])
      : [];

    const meta = {
      financialId: project.financialId,
      status: project.status,
      department: project.department,
      releaseDate: project.releaseDate,
      proposalDeadline: project.proposalDeadline,
      addendumIds: project.addendumIds,
    };

    const { data, error } = await supabase
      .from("user_projects")
      .upsert(
        {
          user_id: user.id,
          project_id: project.id,
          project_title: project.title,
          project_meta: meta,
          files,
          last_opened_at: new Date().toISOString(),
        },
        { onConflict: "user_id,project_id" }
      )
      .select("*")
      .single();
    if (error) throw error;

    await supabase
      .from("profiles")
      .update({
        last_project_id: project.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    return Response.json({
      projectId: data.project_id,
      projectTitle: data.project_title,
      files: data.files,
      lastOpenedAt: data.last_opened_at,
    });
  } catch (e) {
    console.error("[api/my-work PUT]", e);
    return Response.json({ error: "Could not save project." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  // Open a saved project — return full row for client hydrate
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

    const { data, error } = await supabase
      .from("user_projects")
      .select("*")
      .eq("user_id", user.id)
      .eq("project_id", projectId)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return Response.json({ error: "Project not found." }, { status: 404 });
    }

    await supabase
      .from("user_projects")
      .update({ last_opened_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("project_id", projectId);

    const meta = (data.project_meta ?? {}) as Record<string, unknown>;
    const portalProject: PortalProject = {
      id: data.project_id,
      title: data.project_title,
      financialId:
        typeof meta.financialId === "string" ? meta.financialId : String(data.project_id),
      status: typeof meta.status === "string" ? meta.status : "saved",
      department: typeof meta.department === "string" ? meta.department : "",
      releaseDate:
        typeof meta.releaseDate === "string" ? meta.releaseDate : "",
      proposalDeadline:
        typeof meta.proposalDeadline === "string"
          ? meta.proposalDeadline
          : null,
      addendumIds: Array.isArray(meta.addendumIds)
        ? (meta.addendumIds as number[])
        : [],
    };

    return Response.json({
      project: portalProject,
      files: Array.isArray(data.files) ? data.files : [],
    });
  } catch (e) {
    console.error("[api/my-work POST]", e);
    return Response.json({ error: "Could not open project." }, { status: 502 });
  }
}
