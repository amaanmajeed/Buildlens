"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useCallback, useEffect, useState } from "react";
import { Spinner } from "@/components/Spinner";
import { useAppState } from "@/components/workspace/AppStateProvider";
import { Icon } from "@/components/ui/Icon";
import type { PortalProject } from "@/lib/scraper";

export default function OpportunitiesPage() {
  const router = useRouter();
  const { selectPortalProject } = useAppState();
  const [projects, setProjects] = useState<PortalProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/scrape-projects");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Failed to load projects"
        );
      }
      setProjects(Array.isArray(data.projects) ? data.projects : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      void load();
    });
  }, [load]);

  const openProject = (p: PortalProject) => {
    selectPortalProject(p);
    router.push("/spec-analysis");
  };

  return (
    <section className="mx-auto max-w-container-max px-margin-mobile py-stack-xl md:px-margin-desktop">
      <header className="mb-stack-lg">
        <h1 className="text-2xl font-semibold tracking-tight text-primary md:text-3xl">
          Orange County FL — open bids
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
          Select a project to open Spec Analysis. Files load from the Orange
          County procurement portal.
        </p>
      </header>

      {loading ? (
        <Spinner label="Loading projects from portal…" />
      ) : error ? (
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
        <ul className="shadow-buildlens divide-y divide-outline-variant overflow-hidden rounded-xl border border-outline-variant bg-white">
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
                  <h2 className="mt-0.5 text-base font-semibold leading-snug text-primary group-hover:text-primary-container md:text-lg">
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
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-800">
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
