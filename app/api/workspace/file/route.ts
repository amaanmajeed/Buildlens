import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import type { PlanQuantityRow, SovRow } from "@/lib/types";

export async function GET(request: Request) {
  try {
    if (!supabaseConfigured()) {
      return Response.json(
        { error: "Supabase is not configured.", code: "MISSING_SUPABASE" },
        { status: 500 }
      );
    }
    const fileKey = new URL(request.url).searchParams.get("fileKey")?.trim();
    if (!fileKey) {
      return Response.json({ error: "fileKey is required." }, { status: 400 });
    }

    const sb = getSupabase();
    const { data, error } = await sb
      .from("workspace_snapshots")
      .select("*")
      .eq("file_key", fileKey)
      .maybeSingle();
    if (error) throw error;

    if (!data) {
      return Response.json({
        fileKey,
        sovSchedule: [],
        planTakeoff: [],
        planType: null,
        activeChatId: null,
      });
    }

    return Response.json({
      fileKey: data.file_key,
      projectId: data.project_id,
      sovSchedule: Array.isArray(data.sov_schedule) ? data.sov_schedule : [],
      planTakeoff: Array.isArray(data.plan_takeoff) ? data.plan_takeoff : [],
      planType: typeof data.plan_type === "string" ? data.plan_type : null,
      activeChatId: data.active_chat_id ?? null,
    });
  } catch (e) {
    console.error("[api/workspace/file GET]", e);
    return Response.json({ error: "Could not load workspace." }, { status: 502 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!supabaseConfigured()) {
      return Response.json(
        { error: "Supabase is not configured.", code: "MISSING_SUPABASE" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const fileKey =
      typeof body?.fileKey === "string" ? body.fileKey.trim() : "";
    const projectId =
      typeof body?.projectId === "number"
        ? body.projectId
        : Number(body?.projectId);
    if (!fileKey || !Number.isFinite(projectId)) {
      return Response.json(
        { error: "fileKey and projectId are required." },
        { status: 400 }
      );
    }

    const patch: Record<string, unknown> = {
      file_key: fileKey,
      project_id: projectId,
      updated_at: new Date().toISOString(),
    };

    if (Array.isArray(body?.sovSchedule)) {
      patch.sov_schedule = body.sovSchedule as SovRow[];
    }
    if (Array.isArray(body?.planTakeoff)) {
      patch.plan_takeoff = body.planTakeoff as PlanQuantityRow[];
    }
    if (typeof body?.planType === "string" || body?.planType === null) {
      patch.plan_type = body.planType;
    }
    if (
      typeof body?.activeChatId === "string" ||
      body?.activeChatId === null
    ) {
      patch.active_chat_id = body.activeChatId;
    }

    const sb = getSupabase();
    const { data, error } = await sb
      .from("workspace_snapshots")
      .upsert(patch, { onConflict: "file_key" })
      .select("*")
      .single();
    if (error) throw error;

    return Response.json({
      fileKey: data.file_key,
      sovSchedule: data.sov_schedule,
      planTakeoff: data.plan_takeoff,
      planType: data.plan_type,
      activeChatId: data.active_chat_id,
    });
  } catch (e) {
    console.error("[api/workspace/file PUT]", e);
    return Response.json({ error: "Could not save workspace." }, { status: 502 });
  }
}
