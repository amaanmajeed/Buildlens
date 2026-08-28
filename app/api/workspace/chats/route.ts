import { isAuthError, requireUser } from "@/lib/auth";
import type { ChatTurn } from "@/lib/types";

export type FileChatRow = {
  id: string;
  file_key: string;
  title: string;
  messages: ChatTurn[];
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export async function GET(request: Request) {
  try {
    const auth = await requireUser();
    if (isAuthError(auth)) return auth;
    const { supabase, user } = auth;

    const fileKey = new URL(request.url).searchParams.get("fileKey")?.trim();
    if (!fileKey) {
      return Response.json({ error: "fileKey is required." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("file_chats")
      .select("*")
      .eq("user_id", user.id)
      .eq("file_key", fileKey)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;

    const chats = ((data ?? []) as FileChatRow[]).map((c) => ({
      id: c.id,
      fileKey: c.file_key,
      title: c.title,
      messages: Array.isArray(c.messages) ? c.messages : [],
      sortOrder: c.sort_order,
    }));

    return Response.json({ chats });
  } catch (e) {
    console.error("[api/workspace/chats GET]", e);
    return Response.json({ error: "Could not load chats." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (isAuthError(auth)) return auth;
    const { supabase, user } = auth;

    const body = await request.json();
    const fileKey =
      typeof body?.fileKey === "string" ? body.fileKey.trim() : "";
    if (!fileKey) {
      return Response.json({ error: "fileKey is required." }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("file_chats")
      .select("sort_order")
      .eq("user_id", user.id)
      .eq("file_key", fileKey)
      .order("sort_order", { ascending: false })
      .limit(1);

    const nextOrder =
      existing && existing.length > 0
        ? (existing[0].sort_order as number) + 1
        : 0;
    const title =
      typeof body?.title === "string" && body.title.trim()
        ? body.title.trim()
        : `Chat ${nextOrder + 1}`;

    const { data, error } = await supabase
      .from("file_chats")
      .insert({
        user_id: user.id,
        file_key: fileKey,
        title,
        messages: [],
        sort_order: nextOrder,
      })
      .select("*")
      .single();
    if (error) throw error;

    return Response.json({
      chat: {
        id: data.id,
        fileKey: data.file_key,
        title: data.title,
        messages: [],
        sortOrder: data.sort_order,
      },
    });
  } catch (e) {
    console.error("[api/workspace/chats POST]", e);
    return Response.json({ error: "Could not create chat." }, { status: 502 });
  }
}
