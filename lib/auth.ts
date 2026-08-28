import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AuthContext = {
  supabase: SupabaseClient;
  user: User;
};

/** Require a logged-in user for API routes. Returns 401 Response on failure. */
export async function requireUser(): Promise<AuthContext | Response> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      return Response.json(
        { error: "Sign in required.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }
    return { supabase, user };
  } catch {
    return Response.json(
      { error: "Supabase auth is not configured.", code: "MISSING_SUPABASE" },
      { status: 500 }
    );
  }
}

export function isAuthError(v: AuthContext | Response): v is Response {
  return v instanceof Response;
}
