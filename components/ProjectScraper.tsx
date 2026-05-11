"use client";

import { useCallback, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { MSG } from "@/lib/messages";
import { Spinner } from "./Spinner";
import type { PortalProject, ProjectFile } from "@/lib/scraper";

type Step = "idle" | "loading-projects" | "select-project" | "loading-files" | "select-file" | "confirm-file" | "processing";

type Props = {
  onFileReady: (pdfBase64: string, fileName: string) => void;
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

export function ProjectScraper({ onFileReady }: Props) {
  const [step, setStep] = useState<Step>("idle");
  const [projects, setProjects] = useState<PortalProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<PortalProject | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [aiSelectedFile, setAiSelectedFile] = useState<ProjectFile | null>(null);
  const [aiReason, setAiReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [processMsg, setProcessMsg] = useState("");

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

  const selectProject = useCallback(async (project: PortalProject) => {
    setError(null);
    setSelectedProject(project);
    setStep("loading-files");
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
      if (!res.ok) throw new Error(data.error || "Failed to fetch files");

      const projectFiles = data.files as ProjectFile[];
      setFiles(projectFiles);

      if (projectFiles.length === 0) {
        setError("No files found for this project. Try selecting another project.");
        setStep("select-project");
        return;
      }

      setProcessMsg("AI is analyzing files...");
      setStep("select-file");

      const aiRes = await fetch("/api/ai-select-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: projectFiles,
          projectTitle: project.title,
        }),
      });
      const aiData = await aiRes.json();

      if (aiRes.ok && aiData.selectedId) {
        const selected = projectFiles.find((f) => f.id === aiData.selectedId) ?? projectFiles[0];
        setAiSelectedFile(selected);
        setAiReason(aiData.reason || "Best match for spec analysis");
        setStep("confirm-file");
      } else {
        setAiSelectedFile(projectFiles[0]);
        setAiReason("Default: first available file");
        setStep("confirm-file");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
      setStep("select-project");
    }
  }, []);

  const confirmFile = useCallback(async (file: ProjectFile) => {
    setError(null);
    setStep("processing");
    setProcessMsg("Downloading file for analysis...");

    if (file.url.includes("procurement.opengov.com/portal/")) {
      setProcessMsg("");
      setError(
        "This link opens the portal page, not a direct file. Pick another file in the list or upload a PDF below."
      );
      setStep("confirm-file");
      return;
    }

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
          typeof data.error === "string" ? data.error : "Could not download file."
        );
        setStep("confirm-file");
        return;
      }
      const base64 = data.base64;
      if (!base64 || typeof base64 !== "string") {
        setProcessMsg("");
        setError("Could not download file.");
        setStep("confirm-file");
        return;
      }
      const name =
        (typeof data.fileName === "string" && data.fileName) || file.name;
      const contentType =
        (typeof data.contentType === "string" && data.contentType) || "";
      if (!looksLikePdf(name, contentType, base64)) {
        setProcessMsg("");
        setError(MSG.pdfOnly);
        setStep("select-file");
        return;
      }
      onFileReady(base64, name);
      setStep("idle");
      setProcessMsg("");
    } catch {
      setProcessMsg("");
      setError(MSG.aiUnavailable);
      setStep("confirm-file");
    }
  }, [onFileReady]);

  const rejectFile = useCallback(() => {
    setAiSelectedFile(null);
    setProcessMsg("");
    setStep("select-file");
  }, []);

  const manualSelectFile = useCallback((file: ProjectFile) => {
    setAiSelectedFile(file);
    setAiReason("Manually selected by user");
    setStep("confirm-file");
  }, []);

  const reset = useCallback(() => {
    setStep("idle");
    setProjects([]);
    setSelectedProject(null);
    setFiles([]);
    setAiSelectedFile(null);
    setAiReason("");
    setError(null);
    setProcessMsg("");
  }, []);

  return (
    <div className="rounded-lg border border-outline-variant bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="cloud_download" size="md" className="text-primary" />
          <h3 className="text-sm font-semibold text-primary">
            Import from Procurement Portal
          </h3>
        </div>
        {step !== "idle" && step !== "loading-projects" && (
          <button
            type="button"
            onClick={reset}
            className="text-xs text-on-surface-variant hover:text-primary"
          >
            ← Start over
          </button>
        )}
      </div>

      {error && (
        <p className="mb-3 rounded border border-error/30 bg-error-container/40 px-3 py-2 text-xs text-error">
          {error}
        </p>
      )}

      {step === "idle" && (
        <button
          type="button"
          onClick={() => void fetchProjects()}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary/10 px-4 text-sm font-medium text-primary hover:bg-primary/20"
        >
          <Icon name="search" size="sm" />
          Browse Orange County FL Projects
        </button>
      )}

      {step === "loading-projects" && (
        <Spinner label="Fetching active projects from portal..." />
      )}

      {step === "select-project" && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-on-surface-variant">
            Select a project to analyze ({projects.length} found):
          </p>
          <div className="max-h-64 space-y-1.5 overflow-y-auto">
            {projects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => void selectProject(p)}
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
          <p className="text-xs text-on-surface-variant">
            {processMsg || "Select a file to process:"}
          </p>
          {processMsg.includes("AI") ? (
            <Spinner label={processMsg} />
          ) : (
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {files.map((f) => (
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
          )}
        </div>
      )}

      {step === "confirm-file" && aiSelectedFile && (
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
