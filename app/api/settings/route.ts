import { isAuthError, requireUser } from "@/lib/auth";
import { parseAiModelId } from "@/lib/aiModels";
import { settingsDbErrorResponse } from "@/lib/supabaseErrors";

export async function GET() {
  try {
    const auth = await requireUser();
    if (isAuthError(auth)) return auth;
    const { supabase, user } = auth;

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "email, preferred_model, openai_api_key_last4, theme, last_project_id, last_file_key"
      )
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw error;

    if (!data) {
      await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        updated_at: new Date().toISOString(),
      });
      return Response.json({
        email: user.email ?? null,
        preferredModel: parseAiModelId(undefined),
        openaiKeyLast4: null,
        hasOpenaiKey: false,
        theme: null,
        lastProjectId: null,
        lastFileKey: null,
      });
    }

    return Response.json({
      email: data?.email ?? user.email ?? null,
      preferredModel: parseAiModelId(data?.preferred_model),
      openaiKeyLast4: data?.openai_api_key_last4 ?? null,
      hasOpenaiKey: Boolean(data?.openai_api_key_last4),
      theme: data?.theme ?? null,
      lastProjectId: data?.last_project_id ?? null,
      lastFileKey: data?.last_file_key ?? null,
    });
  } catch (e) {
    const mapped = settingsDbErrorResponse(e);
    if (mapped) return mapped;
    console.error("[api/settings GET]", e);
    return Response.json({ error: "Could not load settings." }, { status: 502 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireUser();
    if (isAuthError(auth)) return auth;
    const { supabase, user } = auth;

    const body = await request.json();
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body?.preferredModel !== undefined) {
      patch.preferred_model = parseAiModelId(body.preferredModel);
    }
    if (typeof body?.theme === "string" || body?.theme === null) {
      patch.theme = body.theme;
    }
    if (typeof body?.lastProjectId === "number" || body?.lastProjectId === null) {
      patch.last_project_id = body.lastProjectId;
    }
    if (typeof body?.lastFileKey === "string" || body?.lastFileKey === null) {
      patch.last_file_key = body.lastFileKey;
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", user.id)
      .select(
        "email, preferred_model, openai_api_key_last4, theme, last_project_id, last_file_key"
      )
      .single();
    if (error) throw error;

    return Response.json({
      email: data.email,
      preferredModel: parseAiModelId(data.preferred_model),
      openaiKeyLast4: data.openai_api_key_last4,
      hasOpenaiKey: Boolean(data.openai_api_key_last4),
      theme: data.theme,
      lastProjectId: data.last_project_id,
      lastFileKey: data.last_file_key,
    });
  } catch (e) {
    const mapped = settingsDbErrorResponse(e);
    if (mapped) return mapped;
    console.error("[api/settings PUT]", e);
    return Response.json({ error: "Could not save settings." }, { status: 502 });
  }
}
