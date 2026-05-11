"use client";

import { useCallback, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "./Spinner";
import type { PortalProject, ProjectFile } from "@/lib/scraper";

type Step = "idle" | "loading-projects" | "select-project" | "loading-files" | "select-file" | "confirm-file" | "processing" | "download-prompt";

type Props = {
  onFileReady: (pdfBase64: string, fileName: string) => void;
};

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
    setProcessMsg("Preparing file for analysis...");

    if (file.url.includes("procurement.opengov.com/portal/")) {
      setProcessMsg("");
      setStep("download-prompt");
      return;
    }

    try {
      const res = await fetch(file.url);
      if (!res.ok) throw new Error(`Failed to download file: ${res.status}`);
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("pdf") && !contentType.includes("octet")) {
        setStep("download-prompt");
        return;
      }
      const blob = await res.blob();
      const buffer = await blob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );
      onFileReady(base64, file.name);
    } catch {
      setStep("download-prompt");
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

      {step === "download-prompt" && aiSelectedFile && (
        <div className="space-y-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-medium text-amber-800">
              File identified — download from portal:
            </p>
            <p className="mt-1 text-sm font-medium text-on-surface">
              {aiSelectedFile.name}
            </p>
            <p className="mt-1 text-xs text-on-surface-variant">
              Download this file from the procurement portal, then use the
              &quot;Upload spec PDF&quot; button below to process it.
            </p>
          </div>
          <a
            href={aiSelectedFile.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary hover:opacity-90"
          >
            <Icon name="open_in_new" size="sm" />
            Open Project on Portal
          </a>
        </div>
      )}
    </div>
  );
}
