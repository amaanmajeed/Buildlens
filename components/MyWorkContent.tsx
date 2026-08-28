"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useCallback, useEffect, useState } from "react";
import { Spinner } from "@/components/Spinner";
import { Icon } from "@/components/ui/Icon";
import { useAppState } from "@/components/workspace/AppStateProvider";
import type { PortalProject, ProjectFile } from "@/lib/scraper";

type MyWorkRow = {
  projectId: number;
  projectTitle: string;
  lastOpenedAt: string;
  hasEstimate: boolean;
  hasWorkspace: boolean;
  hasIndexedDocs: boolean;
  files: ProjectFile[];
};

export function MyWorkContent() {
  const router = useRouter();
  const { selectPortalProject, setProjectFiles } = useAppState();
  const [rows, setRows] = useState<MyWorkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/my-work");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Failed to load"
        );
      }
      setRows(Array.isArray(data.projects) ? data.projects : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      void load();
    });
  }, [load]);

  const openSaved = async (projectId: number) => {
    setOpeningId(projectId);
    setError(null);
    try {
      const res = await fetch("/api/my-work", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Could not open"
        );
      }
      const project = data.project as PortalProject;
      const files = (data.files ?? []) as ProjectFile[];
      selectPortalProject(project);
      setProjectFiles(files);
      router.push("/spec-analysis");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open project");
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <section className="mx-auto max-w-container-max px-margin-mobile py-stack-xl md:px-margin-desktop">
      <header className="mb-stack-lg flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-primary md:text-3xl">
            My Work
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
            Bids you&apos;ve opened. Resume from saved SOV, plan takeoff,
            estimates, and chats — no re-indexing unless you ask.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-lg border border-outline-variant px-4 text-sm font-medium text-primary"
        >
          Browse Opportunities
        </Link>
      </header>

      {loading ? (
        <Spinner label="Loading your projects…" />
      ) : error ? (
        <div className="rounded-xl border border-error/30 bg-error-container/30 p-6 text-sm text-error">
          <p className="font-medium">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-4 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-on-primary"
          >
            Retry
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 text-sm text-on-surface-variant">
          <p>No saved projects yet.</p>
          <Link
            href="/"
            className="mt-3 inline-flex font-medium text-primary underline"
          >
            Open a bid from Opportunities
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r.projectId}
              className="flex flex-col gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-on-surface">
                  {r.projectTitle}
                </p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Last opened{" "}
                  {new Date(r.lastOpenedAt).toLocaleString()} ·{" "}
                  {[
                    r.hasIndexedDocs ? "indexed" : null,
                    r.hasWorkspace ? "workspace" : null,
                    r.hasEstimate ? "estimate" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "saved"}
                </p>
              </div>
              <button
                type="button"
                disabled={openingId === r.projectId}
                onClick={() => void openSaved(r.projectId)}
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary disabled:opacity-50"
              >
                <Icon name="arrow_forward" size="sm" />
                {openingId === r.projectId ? "Opening…" : "Open"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
