import {
  createClient as createSupabaseJsClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabaseEnv";
import {
  COOKIE_NAME,
  type SessionBlob,
} from "@/lib/supabase/sessionCookie";

/**
 * Server Supabase client bound to the request auth cookie.
 * ponytail: cookie session without @supabase/ssr (npm registry timeouts).
 */
export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  let accessToken: string | undefined;
  let refreshToken: string | undefined;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as SessionBlob;
      accessToken = parsed.access_token;
      refreshToken = parsed.refresh_token;
    } catch {
      /* ignore bad cookie */
    }
  }

  const supabase = createSupabaseJsClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: accessToken
        ? { headers: { Authorization: `Bearer ${accessToken}` } }
        : undefined,
    }
  );

  if (accessToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  return supabase;
}
