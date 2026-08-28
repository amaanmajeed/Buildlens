"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const supabase = createBrowserClient();
      const { data, error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (err) {
        setError(err.message);
        return;
      }
      if (data.session) {
        const sync = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          }),
        });
        if (!sync.ok) {
          const j = await sync.json().catch(() => ({}));
          setError(
            typeof j.error === "string" ? j.error : "Session sync failed"
          );
          return;
        }
        router.replace("/");
        router.refresh();
        return;
      }
      setInfo("Check your email to confirm your account, then sign in.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-bright px-4">
      <div className="w-full max-w-md rounded-xl border border-outline-variant bg-surface-container-lowest p-8 shadow-buildlens">
        <h1 className="text-2xl font-semibold tracking-tight text-primary">
          Create a BuildLens account
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Your workspace, keys, and bids stay private to your account.
        </p>
        <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
          {error ? (
            <p className="rounded-lg border border-error/30 bg-error-container/40 px-3 py-2 text-sm text-error">
              {error}
            </p>
          ) : null}
          {info ? (
            <p className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface">
              {info}
            </p>
          ) : null}
          <label className="block text-sm font-medium text-on-surface-variant">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-on-surface"
            />
          </label>
          <label className="block text-sm font-medium text-on-surface-variant">
            Password
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-on-surface"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-on-primary disabled:opacity-50"
          >
            {loading ? "Creating…" : "Sign up"}
          </button>
          <p className="text-center text-sm text-on-surface-variant">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
