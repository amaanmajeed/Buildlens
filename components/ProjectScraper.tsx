"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { MSG } from "@/lib/messages";
import { useAppState } from "@/components/workspace/AppStateProvider";
import { Spinner } from "./Spinner";
import type { PortalProject, ProjectFile } from "@/lib/scraper";

type Step =
  | "idle"
  | "loading-projects"
  | "select-project"
  | "loading-files"
  | "select-file"
  | "confirm-file"
  | "ready"
  | "processing";

type Props = {
  onFileReady: (
    pdfBase64: string,
    fileName: string,
    sourceFile?: ProjectFile | null
  ) => void;
  /** When true: no project browse; files only from current context (Spec / guided flow). */
  lockProject?: boolean;
};

function looksLikePdf(fileName: string, contentType: string, base64: string) {
  if (fileName.toLowerCase().endsWith(".pdf")) return true;
  if (contentType.toLowerCase().includes("pdf")) return true;
  try {
    const head = atob(base64.slice(0, 28));
    return head.startsWith("%PDF");
  } catch {
    return false;
  }
}

export function ProjectScraper({
  onFileReady,
  lockProject = true,
}: Props) {
  const {
    selectedProject,
    setSelectedProject,
    setProjectFiles,
    selectPortalProject,
    projectFiles,
    portalPdfCache,
    setPortalPdfCache,
  } = useAppState();

  const [step, setStep] = useState<Step>("idle");
  const [projects, setProjects] = useState<PortalProject[]>([]);
  const [chosenFileId, setChosenFileId] = useState<string | null>(null);
  const [aiSelectedFile, setAiSelectedFile] = useState<ProjectFile | null>(
    null
  );
  const [aiReason, setAiReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [processMsg, setProcessMsg] = useState("");
  const [aiPicking, setAiPicking] = useState(false);

  useEffect(() => {
    if (!selectedProject) return;

    let cancelled = false;

    (async () => {
      setError(null);
      setAiSelectedFile(null);
      setAiReason("");
      setChosenFileId(null);
      setProcessMsg("");
      setAiPicking(false);
      setProjectFiles([]);
      setStep("loading-files");

      const project = selectedProject;

      try {
        const res = await fetch("/api/scrape-project-files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: project.id,
            addendumIds: project.addendumIds,
            projectTitle: project.title,
          }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || "Failed to fetch files");

        const list = data.files as ProjectFile[];
        setProjectFiles(list);

        if (list.length === 0) {
          setError(
            "No files found for this project. Try another project or upload a PDF below."
          );
          setStep("idle");
          return;
        }

        if (lockProject) {
          setChosenFileId(list[0].id);
          setAiReason("");
          setStep("ready");
          setAiPicking(true);
        } else {
          setStep("select-file");
          setAiPicking(true);
        }

        const aiRes = await fetch("/api/ai-select-file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            files: list,
            projectTitle: project.title,
          }),
        });
        const aiData = await aiRes.json();
        if (cancelled) return;

        let picked: ProjectFile = list[0];
        let reason = "Default: first available file";

        if (aiRes.ok && aiData.selectedId) {
          picked =
            list.find((f) => f.id === aiData.selectedId) ?? list[0];
          reason = aiData.reason || "Best match for spec analysis";
        }

        setAiPicking(false);

        if (lockProject) {
          setChosenFileId(picked.id);
          setAiReason(reason);
        } else {
          setAiSelectedFile(picked);
          setAiReason(reason);
          setStep("confirm-file");
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Network error");
        setStep("idle");
      }
    })();

    return () => {
      cancelled = true;
    };
    // Intentionally key off project id only; full object identity can churn without a new project.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync to selectedProject.id
  }, [selectedProject?.id, setProjectFiles, lockProject]);

  const fetchProjects = useCallback(async () => {
    setError(null);
    setStep("loading-projects");
    try {
      const res = await fetch("/api/scrape-projects");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch projects");
      setProjects(data.projects);
      setStep("select-project");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
      setStep("idle");
    }
  }, []);

  const confirmFile = useCallback(
    async (file: ProjectFile) => {
      setError(null);

      if (file.url.includes("procurement.opengov.com/portal/")) {
        setProcessMsg("");
        setError(
          "This link opens the portal page, not a direct file. Pick another file in the list or upload a PDF below."
        );
        setStep(lockProject ? "ready" : "confirm-file");
        return;
      }

      if (portalPdfCache?.fileId === file.id && portalPdfCache.base64) {
        onFileReady(
          portalPdfCache.base64,
          portalPdfCache.fileName,
          file
        );
        setStep(lockProject ? "ready" : "idle");
        return;
      }

      setStep("processing");
      setProcessMsg("Downloading file for analysis...");
      try {
        const res = await fetch("/api/fetch-procurement-file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: file.url }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          base64?: string;
          fileName?: string;
          contentType?: string;
        };
        if (!res.ok) {
          setProcessMsg("");
          setError(
            typeof data.error === "string"
              ? data.error
              : "Could not download file."
          );
          setStep(lockProject ? "ready" : "confirm-file");
          return;
        }
        const base64 = data.base64;
        if (!base64 || typeof base64 !== "string") {
          setProcessMsg("");
          setError("Could not download file.");
          setStep(lockProject ? "ready" : "confirm-file");
          return;
        }
        const name =
          (typeof data.fileName === "string" && data.fileName) || file.name;
        const contentType =
          (typeof data.contentType === "string" && data.contentType) || "";
        if (!looksLikePdf(name, contentType, base64)) {
          setProcessMsg("");
          setError(MSG.pdfOnly);
          setStep(lockProject ? "ready" : "select-file");
          return;
        }
        setPortalPdfCache({ fileId: file.id, base64, fileName: name });
        onFileReady(base64, name, file);
        setStep(lockProject ? "ready" : "idle");
        setProcessMsg("");
      } catch {
        setProcessMsg("");
        setError(MSG.aiUnavailable);
        setStep(lockProject ? "ready" : "confirm-file");
      }
    },
    [onFileReady, lockProject, portalPdfCache, setPortalPdfCache]
  );

  const rejectFile = useCallback(() => {
    setAiSelectedFile(null);
    setProcessMsg("");
    setStep("select-file");
  }, []);

  const manualSelectFile = useCallback((file: ProjectFile) => {
    setAiPicking(false);
    setAiSelectedFile(file);
    setAiReason("Manually selected by user");
    setStep("confirm-file");
  }, []);

  const reset = useCallback(() => {
    selectPortalProject(null);
    setStep("idle");
    setProjects([]);
    setChosenFileId(null);
    setAiSelectedFile(null);
    setAiReason("");
    setError(null);
    setProcessMsg("");
    setAiPicking(false);
  }, [selectPortalProject]);

  const runLockedExtraction = () => {
    if (!chosenFileId) return;
    const file = projectFiles.find((f) => f.id === chosenFileId);
    if (file) void confirmFile(file);
  };

  if (lockProject && !selectedProject) {
    return (
      <div className="rounded-lg border border-outline-variant bg-white p-4 shadow-sm">
        <p className="text-sm text-on-surface-variant">
          Choose an open bid on Opportunities to load this project&apos;s files.
        </p>
        <Link
          href="/opportunities"
          className="mt-3 inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-on-primary"
        >
          Go to Opportunities
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-outline-variant bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="cloud_download" size="md" className="text-primary" />
          <h3 className="text-sm font-semibold text-primary">
            {lockProject
              ? "Project files (locked to this bid)"
              : "Import from Procurement Portal"}
          </h3>
        </div>
        {!lockProject &&
          step !== "idle" &&
          step !== "loading-projects" && (
          <button
            type="button"
            onClick={reset}
            className="text-xs text-on-surface-variant hover:text-primary"
          >
            ← Start over
          </button>
        )}
      </div>

      {selectedProject && (lockProject || step === "idle") ? (
        <p className="mb-3 text-xs text-on-surface-variant">
          Project: <strong>{selectedProject.title}</strong>
          {!lockProject
            ? ". Use Browse to pick another project, or upload a PDF below."
            : ". Only files from this solicitation are listed."}
        </p>
      ) : null}

      {error && (
        <p className="mb-3 rounded border border-error/30 bg-error-container/40 px-3 py-2 text-xs text-error">
          {error}
        </p>
      )}

      {!lockProject && step === "idle" && (
        <button
          type="button"
          onClick={() => void fetchProjects()}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary/10 px-4 text-sm font-medium text-primary hover:bg-primary/20"
        >
          <Icon name="search" size="sm" />
          Browse Orange County FL Projects
        </button>
      )}

      {!lockProject && step === "loading-projects" && (
        <Spinner label="Fetching active projects from portal..." />
      )}

      {!lockProject && step === "select-project" && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-on-surface-variant">
            Select a project to analyze ({projects.length} found):
          </p>
          <div className="max-h-64 space-y-1.5 overflow-y-auto">
            {projects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedProject(p)}
                className="w-full rounded-lg border border-outline-variant p-3 text-left transition-colors hover:border-primary hover:bg-primary/5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-on-surface">
                      {p.title}
                    </p>
                    <p className="mt-0.5 text-xs text-on-surface-variant">
                      {p.financialId} · {p.department}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                    {p.status}
                  </span>
                </div>
                {p.proposalDeadline && (
                  <p className="mt-1 text-[10px] text-on-surface-variant">
                    Due: {new Date(p.proposalDeadline).toLocaleDateString()}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "loading-files" && (
        <div>
          <p className="mb-2 text-xs text-on-surface-variant">
            Project: <strong>{selectedProject?.title}</strong>
          </p>
          <Spinner label="Fetching project files..." />
        </div>
      )}

      {step === "select-file" && (
        <div className="space-y-2">
          {!lockProject && projectFiles.length > 0 ? (
            <>
              {aiPicking ? (
                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <Spinner label="" />
                  <span>AI is analyzing files for a recommendation…</span>
                </div>
              ) : null}
              <p className="text-xs font-medium text-on-surface-variant">
                Project files ({projectFiles.length}):
              </p>
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {projectFiles.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => manualSelectFile(f)}
                    className="w-full rounded border border-outline-variant p-2 text-left text-xs hover:border-primary hover:bg-primary/5"
                  >
                    <span className="font-medium text-on-surface">{f.name}</span>
                    <span className="ml-2 text-on-surface-variant uppercase">
                      ({f.type})
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
      )}

      {step === "ready" && lockProject && chosenFileId && (
        <div className="space-y-3">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-on-surface-variant">
            Spec PDF
            <select
              value={chosenFileId}
              onChange={(e) => setChosenFileId(e.target.value)}
              className="h-10 rounded-lg border border-outline-variant bg-white px-3 text-sm text-on-surface shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {projectFiles.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.type})
                </option>
              ))}
            </select>
          </label>
          {aiPicking ? (
            <div className="flex items-center gap-2 text-xs text-on-surface-variant">
              <Spinner label="" />
              <span>AI is analyzing files… selection will update when ready.</span>
            </div>
          ) : aiReason ? (
            <p className="text-xs text-on-surface-variant">
              AI suggestion: <span className="text-on-surface">{aiReason}</span>
            </p>
          ) : null}
          <button
            type="button"
            onClick={runLockedExtraction}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:opacity-90"
          >
            <Icon name="check" size="sm" />
            Load PDF &amp; extract spec
          </button>
        </div>
      )}

      {!lockProject && step === "confirm-file" && aiSelectedFile && (
        <div className="space-y-3">
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
            <p className="text-xs font-medium text-primary">
              AI Recommended File:
            </p>
            <p className="mt-1 text-sm font-medium text-on-surface">
              {aiSelectedFile.name}
            </p>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              {aiReason}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void confirmFile(aiSelectedFile)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:opacity-90"
            >
              <Icon name="check" size="sm" />
              Confirm & Process
            </button>
            <button
              type="button"
              onClick={rejectFile}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-outline-variant px-4 text-sm font-medium text-on-surface hover:bg-surface-variant"
            >
              <Icon name="close" size="sm" />
              Choose Different File
            </button>
          </div>
        </div>
      )}

      {step === "processing" && <Spinner label={processMsg} />}
    </div>
  );
}
