import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabaseEnv";
import {
  COOKIE_NAME,
  type SessionBlob,
} from "@/lib/supabase/sessionCookie";

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request });

  const raw = request.cookies.get(COOKIE_NAME)?.value;
  let accessToken: string | undefined;
  let refreshToken: string | undefined;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as SessionBlob;
      accessToken = parsed.access_token;
      refreshToken = parsed.refresh_token;
    } catch {
      /* ignore */
    }
  }

  const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  });

  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (!error && data.session) {
      const blob: SessionBlob = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      };
      supabaseResponse.cookies.set(COOKIE_NAME, JSON.stringify(blob), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser(
    accessToken ? accessToken : undefined
  );

  return { supabase, user, supabaseResponse };
}
