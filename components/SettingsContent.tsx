"use client";

import { FormEvent, useEffect, useState } from "react";
import { AI_MODEL_OPTIONS, parseAiModelId, type AiModelId } from "@/lib/aiModels";
import { useAppState } from "@/components/workspace/AppStateProvider";
import { Icon } from "@/components/ui/Icon";

function maskedKeyPlaceholder(last4: string | null): string {
  return `••••••••••••${last4 ?? "••••"}`;
}

export function SettingsContent() {
  const { aiModel, setAiModel } = useAppState();
  const [email, setEmail] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [last4, setLast4] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [editingKey, setEditingKey] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError(
            typeof data.error === "string" ? data.error : "Could not load settings"
          );
          return;
        }
        setEmail(data.email ?? null);
        setHasKey(Boolean(data.hasOpenaiKey));
        setLast4(data.openaiKeyLast4 ?? null);
        if (data.preferredModel) {
          setAiModel(parseAiModelId(data.preferredModel));
        }
      } catch {
        if (!cancelled) setError("Could not load settings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setAiModel]);

  const saveModel = async (model: AiModelId) => {
    setAiModel(model);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferredModel: model }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(
        typeof data.error === "string" ? data.error : "Could not save model"
      );
    }
  };

  const beginEditKey = () => {
    if (!hasKey || editingKey) return;
    setEditingKey(true);
    setApiKey("");
  };

  const saveKey = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setBanner(null);
    try {
      const res = await fetch("/api/settings/openai-key", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === "string" ? data.error : "Could not save key"
        );
        return;
      }
      setHasKey(true);
      setLast4(data.openaiKeyLast4 ?? null);
      setApiKey("");
      setEditingKey(false);
      setBanner("OpenAI API key saved (encrypted).");
    } catch {
      setError("Could not save key");
    } finally {
      setSaving(false);
    }
  };

  const clearKey = async () => {
    setSaving(true);
    setError(null);
    setBanner(null);
    try {
      const res = await fetch("/api/settings/openai-key", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === "string" ? data.error : "Could not clear key"
        );
        return;
      }
      setHasKey(false);
      setLast4(null);
      setApiKey("");
      setEditingKey(false);
      setBanner("OpenAI API key removed.");
    } catch {
      setError("Could not clear key");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="px-margin-mobile py-8 text-sm text-on-surface-variant md:px-margin-desktop">
        Loading settings…
      </p>
    );
  }

  const keyLocked = hasKey && !editingKey;
  const keyPlaceholder = keyLocked
    ? maskedKeyPlaceholder(last4)
    : "sk-…";

  return (
    <div className="mx-auto max-w-xl px-margin-mobile py-stack-xl md:px-margin-desktop">
      <h1 className="text-2xl font-semibold tracking-tight text-primary">
        Settings
      </h1>
      <p className="mt-2 text-sm text-on-surface-variant">
        Account preferences and your OpenAI API key (stored encrypted).
      </p>

      {error ? (
        <p className="mt-4 rounded-lg border border-error/30 bg-error-container/40 px-3 py-2 text-sm text-error">
          {error}
        </p>
      ) : null}
      {banner ? (
        <p className="mt-4 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface">
          {banner}
        </p>
      ) : null}

      <section className="mt-8 space-y-2">
        <h2 className="text-sm font-semibold text-primary">Account</h2>
        <p className="text-sm text-on-surface">{email ?? "—"}</p>
      </section>

      <section className="mt-8 space-y-2">
        <h2 className="text-sm font-semibold text-primary">Preferred model</h2>
        <select
          value={aiModel}
          onChange={(e) => void saveModel(parseAiModelId(e.target.value))}
          className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm"
        >
          {AI_MODEL_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </section>

      <section className="mt-8 space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-primary">OpenAI API key</h2>
          {hasKey ? (
            <span
              className="inline-flex items-center gap-1 text-xs font-medium text-primary"
              title="API key on file"
            >
              <Icon name="check_circle" size="sm" className="text-primary" />
              Key added
            </span>
          ) : null}
        </div>
        <p className="text-xs text-on-surface-variant">
          {hasKey
            ? "Click the field to replace the key. It stays empty until you type a new one."
            : "Required for Spec File Search index and chat. Never shown again after save."}
        </p>
        <p
          role="status"
          className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant"
        >
          Warning: your OpenAI key is stored encrypted on the server, never as
          plain text.
        </p>
        <form onSubmit={(e) => void saveKey(e)} className="space-y-3">
          <div className="relative">
            <input
              type="password"
              autoComplete="off"
              readOnly={keyLocked}
              placeholder={keyPlaceholder}
              value={apiKey}
              onFocus={beginEditKey}
              onClick={beginEditKey}
              onChange={(e) => setApiKey(e.target.value)}
              onBlur={() => {
                if (!apiKey.trim()) setEditingKey(false);
              }}
              className={`h-11 w-full rounded-lg border border-outline-variant px-3 pr-10 text-sm ${
                keyLocked
                  ? "cursor-pointer bg-surface-container text-on-surface-variant"
                  : "bg-surface-container-lowest"
              }`}
              aria-label={
                keyLocked
                  ? `OpenAI API key ending in ${last4 ?? "••••"}. Click to replace.`
                  : "OpenAI API key"
              }
            />
            {hasKey ? (
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <Icon name="check" size="sm" className="text-primary" />
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving || !apiKey.trim()}
              className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-on-primary disabled:opacity-50"
            >
              {saving ? "Saving…" : hasKey ? "Replace key" : "Save key"}
            </button>
            {hasKey ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => void clearKey()}
                className="inline-flex h-10 items-center rounded-lg border border-outline-variant px-4 text-sm font-medium text-on-surface"
              >
                Clear key
              </button>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  );
}
