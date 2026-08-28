"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useCallback, useEffect, useState } from "react";
import { Spinner } from "@/components/Spinner";
import { useAppState } from "@/components/workspace/AppStateProvider";
import { Icon } from "@/components/ui/Icon";
import type { PortalProject } from "@/lib/scraper";

export function OpportunitiesContent() {
  const router = useRouter();
  const { selectPortalProject } = useAppState();
  const [projects, setProjects] = useState<PortalProject[]>([]);
  const [scrapedAt, setScrapedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyResponse = async (res: Response) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        typeof data.error === "string" ? data.error : "Failed to load projects"
      );
    }
    setProjects(Array.isArray(data.projects) ? data.projects : []);
    setScrapedAt(
      typeof data.scrapedAt === "string" ? data.scrapedAt : null
    );
  };

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/scrape-projects");
      await applyResponse(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setError(null);
    setRefreshing(true);
    try {
      const res = await fetch("/api/scrape-projects", { method: "POST" });
      await applyResponse(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      void load();
    });
  }, [load]);

  const openProject = (p: PortalProject) => {
    selectPortalProject(p);
    void fetch("/api/my-work", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project: p, files: [] }),
    });
    router.push("/spec-analysis");
  };

  return (
    <section className="mx-auto max-w-container-max px-margin-mobile py-stack-xl md:px-margin-desktop">
      <header className="mb-stack-lg flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-primary md:text-3xl">
            Orange County FL — open bids
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
            Select a project to open Spec Analysis. Files load from the Orange
            County procurement portal.
            {scrapedAt ? (
              <>
                {" "}
                Last refreshed{" "}
                {new Date(scrapedAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
                .
              </>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading || refreshing}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-outline-variant px-4 text-sm font-medium text-primary disabled:opacity-50"
        >
          <Icon
            name="refresh"
            size="sm"
            className={refreshing ? "animate-spin" : undefined}
          />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {error && projects.length > 0 ? (
        <div className="mb-4 rounded-lg border border-error/30 bg-error-container/30 px-4 py-3 text-sm text-error">
          {error}
        </div>
      ) : null}

      {loading ? (
        <Spinner label="Loading projects…" />
      ) : error && projects.length === 0 ? (
        <div className="rounded-xl border border-error/30 bg-error-container/30 p-6 text-sm text-error">
          <p className="font-medium">{error}</p>
          <p className="mt-2 text-on-surface-variant">
            You can still{" "}
            <Link href="/spec-analysis" className="font-semibold text-primary underline">
              open Spec Analysis
            </Link>{" "}
            and upload a PDF manually.
          </p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-4 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-on-primary"
          >
            Retry
          </button>
        </div>
      ) : projects.length === 0 ? (
        <p className="text-on-surface-variant">
          No open projects returned.{" "}
          <Link href="/spec-analysis" className="font-semibold text-primary underline">
            Go to Spec Analysis
          </Link>
        </p>
      ) : (
        <ul className="shadow-buildlens divide-y divide-outline-variant overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
          {projects.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => openProject(p)}
                className="group flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-primary/[0.04] md:gap-6 md:px-5 md:py-4"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
                    {p.department}
                  </span>
                  <h2 className="mt-0.5 text-base font-semibold leading-snug text-primary group-hover:text-on-primary-container md:text-lg">
                    {p.title}
                  </h2>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {p.financialId}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                  {p.proposalDeadline ? (
                    <span className="whitespace-nowrap text-xs text-on-surface-variant">
                      Due {new Date(p.proposalDeadline).toLocaleDateString()}
                    </span>
                  ) : null}
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300">
                    {p.status}
                  </span>
                  <Icon
                    name="arrow_forward"
                    size="sm"
                    className="hidden text-primary sm:block"
                  />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
