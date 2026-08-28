import { decryptSecret } from "@/lib/cryptoSecrets";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolve OpenAI key for the current user.
 * Prefer encrypted profile key; optional OPENAI_API_KEY env only when profile has none (local bootstrap).
 */
export async function resolveOpenAiApiKey(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const { data, error } = await supabase
    .from("profiles")
    .select("openai_api_key_ciphertext")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;

  const cipher = data?.openai_api_key_ciphertext;
  if (typeof cipher === "string" && cipher.trim()) {
    return decryptSecret(cipher);
  }

  const envKey = process.env.OPENAI_API_KEY?.trim();
  if (envKey) return envKey;

  throw new Error("missing_openai_api_key");
}
