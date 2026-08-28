/** Map common PostgREST / setup failures to a user-facing Response. */
export function settingsDbErrorResponse(e: unknown): Response | null {
  const code =
    e && typeof e === "object" && "code" in e
      ? String((e as { code: unknown }).code)
      : "";
  const message =
    e && typeof e === "object" && "message" in e
      ? String((e as { message: unknown }).message)
      : e instanceof Error
        ? e.message
        : String(e);

  if (
    code === "PGRST205" ||
    message.includes("'public.profiles'") ||
    message.includes("schema cache")
  ) {
    return Response.json(
      {
        error:
          "Database is missing the profiles table. Run supabase/migrations/001_auth_per_user.sql in the Supabase SQL editor, then try again.",
        code: "MISSING_PROFILES_TABLE",
      },
      { status: 503 }
    );
  }

  if (message === "missing_encryption_key" || message === "invalid_encryption_key") {
    return Response.json(
      {
        error: "Server encryption is not configured (APP_ENCRYPTION_KEY).",
        code: "MISSING_ENCRYPTION_KEY",
      },
      { status: 500 }
    );
  }

  return null;
}
