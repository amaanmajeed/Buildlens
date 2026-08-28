import { isAuthError, requireUser } from "@/lib/auth";
import { encryptSecret, last4 } from "@/lib/cryptoSecrets";
import { settingsDbErrorResponse } from "@/lib/supabaseErrors";

export async function PUT(request: Request) {
  try {
    const auth = await requireUser();
    if (isAuthError(auth)) return auth;
    const { supabase, user } = auth;

    const body = await request.json();
    const key =
      typeof body?.apiKey === "string" ? body.apiKey.trim() : "";
    if (!key || key.length < 8) {
      return Response.json(
        { error: "Enter a valid OpenAI API key." },
        { status: 400 }
      );
    }

    const ciphertext = encryptSecret(key);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email,
      openai_api_key_ciphertext: ciphertext,
      openai_api_key_last4: last4(key),
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;

    return Response.json({
      ok: true,
      openaiKeyLast4: last4(key),
      hasOpenaiKey: true,
    });
  } catch (e) {
    const mapped = settingsDbErrorResponse(e);
    if (mapped) return mapped;
    console.error("[api/settings/openai-key PUT]", e);
    return Response.json({ error: "Could not save API key." }, { status: 502 });
  }
}

export async function DELETE() {
  try {
    const auth = await requireUser();
    if (isAuthError(auth)) return auth;
    const { supabase, user } = auth;

    const { error } = await supabase
      .from("profiles")
      .update({
        openai_api_key_ciphertext: null,
        openai_api_key_last4: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    if (error) throw error;

    return Response.json({ ok: true, hasOpenaiKey: false, openaiKeyLast4: null });
  } catch (e) {
    const mapped = settingsDbErrorResponse(e);
    if (mapped) return mapped;
    console.error("[api/settings/openai-key DELETE]", e);
    return Response.json({ error: "Could not clear API key." }, { status: 502 });
  }
}
