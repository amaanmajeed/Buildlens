import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabaseEnv";
import { clearAuthCookie, setAuthCookie } from "@/lib/supabase/authCookie";

/** Exchange client session tokens for an httpOnly cookie. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const access_token =
      typeof body?.access_token === "string" ? body.access_token : "";
    const refresh_token =
      typeof body?.refresh_token === "string" ? body.refresh_token : "";
    if (!access_token || !refresh_token) {
      return Response.json({ error: "Missing tokens." }, { status: 400 });
    }

    const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    if (error || !data.session) {
      return Response.json(
        { error: error?.message ?? "Invalid session." },
        { status: 401 }
      );
    }

    const res = NextResponse.json({
      ok: true,
      user: { id: data.user?.id, email: data.user?.email },
    });
    setAuthCookie(res, data.session);
    return res;
  } catch (e) {
    console.error("[api/auth/session POST]", e);
    return Response.json({ error: "Could not set session." }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  clearAuthCookie(res);
  return res;
}
