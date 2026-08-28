/**
 * Service-role client for rare admin/server jobs that must bypass RLS.
 * Prefer `lib/supabase/server` (user JWT) for normal API routes.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "@/lib/supabaseEnv";

let client: SupabaseClient | null = null;

export function getServiceSupabase(): SupabaseClient {
  if (client) return client;
  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) throw new Error("missing_supabase");
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

/** @deprecated Use getServiceSupabase or user-scoped createClient from lib/supabase/server */
export function getSupabase(): SupabaseClient {
  return getServiceSupabase();
}

export function supabaseConfigured(): boolean {
  return Boolean(
    (process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
      process.env.SUPABASE_URL?.trim()) &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}
