import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import type { ChatTurn } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    if (!supabaseConfigured()) {
      return Response.json(
        { error: "Supabase is not configured.", code: "MISSING_SUPABASE" },
        { status: 500 }
      );
    }
    const { id } = await ctx.params;
    if (!id) {
      return Response.json({ error: "id is required." }, { status: 400 });
    }

    const body = await request.json();
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (typeof body?.title === "string" && body.title.trim()) {
      patch.title = body.title.trim();
    }
    if (Array.isArray(body?.messages)) {
      patch.messages = body.messages as ChatTurn[];
    }
    if (Object.keys(patch).length === 1) {
      return Response.json({ error: "Nothing to update." }, { status: 400 });
    }

    const sb = getSupabase();
    const { data, error } = await sb
      .from("file_chats")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;

    return Response.json({
      chat: {
        id: data.id,
        fileKey: data.file_key,
        title: data.title,
        messages: Array.isArray(data.messages) ? data.messages : [],
        sortOrder: data.sort_order,
      },
    });
  } catch (e) {
    console.error("[api/workspace/chats PATCH]", e);
    return Response.json({ error: "Could not update chat." }, { status: 502 });
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    if (!supabaseConfigured()) {
      return Response.json(
        { error: "Supabase is not configured.", code: "MISSING_SUPABASE" },
        { status: 500 }
      );
    }
    const { id } = await ctx.params;
    if (!id) {
      return Response.json({ error: "id is required." }, { status: 400 });
    }

    const sb = getSupabase();
    const { error } = await sb.from("file_chats").delete().eq("id", id);
    if (error) throw error;

    return Response.json({ ok: true });
  } catch (e) {
    console.error("[api/workspace/chats DELETE]", e);
    return Response.json({ error: "Could not delete chat." }, { status: 502 });
  }
}
