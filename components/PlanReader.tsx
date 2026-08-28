"use client";

import { useCallback, useEffect, useRef, useState, startTransition } from "react";
import { fileToBase64 } from "@/lib/fileBase64";
import { makeFileKey, makeManualFileKey, shortContentHash } from "@/lib/fileKey";
import { MSG } from "@/lib/messages";
import type { ProjectFile } from "@/lib/scraper";
import type { PlanQuantityRow } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { useAppState } from "@/components/workspace/AppStateProvider";
import { Spinner } from "./Spinner";

const MAX_BYTES = 20 * 1024 * 1024;

const PLAN_TYPES = [
  "Paving",
  "Utility",
  "Signalization",
  "Drainage",
  "Other",
] as const;

type LocalRow = PlanQuantityRow & { id: string };

function confidenceClass(c: string) {
  const v = c.toLowerCase();
  if (v === "high")
    return "bg-emerald-50 text-green-900 ring-1 ring-emerald-300";
  if (v === "medium")
    return "bg-amber-50 text-amber-900 ring-1 ring-amber-400";
  return "bg-red-50 text-red-800 ring-1 ring-red-400";
}

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

function withIds(list: PlanQuantityRow[]): LocalRow[] {
  return list.map((r) => ({
    ...r,
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${r.item}-${r.quantity}-${Math.random()}`,
  }));
}

export function PlanReader() {
  const {
    sendToEstimateDraft,
    projectFiles,
    specSourceFileId,
    selectedProject,
    portalPdfCache,
    aiModel,
  } = useAppState();
  const fileInput = useRef<HTMLInputElement>(null);
  const manualPdfRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [fileLabel, setFileLabel] = useState("");
  const [fileKey, setFileKey] = useState<string | null>(null);
  const [selectedPortalFileId, setSelectedPortalFileId] = useState<
    string | null
  >(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [planType, setPlanType] =
    useState<(typeof PLAN_TYPES)[number]>("Paving");
  const [rows, setRows] = useState<LocalRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const pickFile = () => fileInput.current?.click();

  const persistPlan = useCallback(
    (key: string, projectId: number, takeoff: LocalRow[], type: string) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void fetch("/api/workspace/file", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileKey: key,
            projectId,
            planTakeoff: takeoff.map((row) => {
              const { id: _omit, ...rest } = row;
              void _omit;
              return rest;
            }),
            planType: type,
          }),
        });
      }, 500);
    },
    []
  );

  useEffect(() => {
    manualPdfRef.current = false;
  }, [selectedProject?.id]);

  useEffect(() => {
    if (projectFiles.length === 0) {
      if (!manualPdfRef.current) setSelectedPortalFileId(null);
      return;
    }
    if (manualPdfRef.current) return;

    const hint =
      specSourceFileId &&
      projectFiles.some((f) => f.id === specSourceFileId)
        ? specSourceFileId
        : projectFiles[0].id;

    setSelectedPortalFileId((prev) => {
      if (prev && projectFiles.some((f) => f.id === prev)) return prev;
      return hint;
    });
  }, [projectFiles, specSourceFileId]);

  const hydrateWorkspace = useCallback(async (key: string) => {
    setHydrated(false);
    try {
      const res = await fetch(
        `/api/workspace/file?fileKey=${encodeURIComponent(key)}`
      );
      const data = await res.json().catch(() => ({}));
      const takeoff = Array.isArray(data.planTakeoff) ? data.planTakeoff : [];
      if (
        typeof data.planType === "string" &&
        (PLAN_TYPES as readonly string[]).includes(data.planType)
      ) {
        setPlanType(data.planType as (typeof PLAN_TYPES)[number]);
      }
      setRows(takeoff.length > 0 ? withIds(takeoff as PlanQuantityRow[]) : []);
    } catch {
      setRows([]);
    } finally {
      setHydrated(true);
    }
  }, []);

  const loadPortalPdf = useCallback(
    async (file: ProjectFile) => {
      setBanner(null);
      const key = selectedProject
        ? makeFileKey(selectedProject.id, file.name)
        : null;
      setFileKey(key);
      if (key) void hydrateWorkspace(key);

      if (portalPdfCache?.fileId === file.id && portalPdfCache.base64) {
        setFileLabel(portalPdfCache.fileName);
        setPdfBase64(portalPdfCache.base64);
        return;
      }

      if (!file.url || file.url.includes("procurement.opengov.com/portal/")) {
        if (!file.url) {
          setFileLabel(file.name);
          setPdfBase64(null);
          return;
        }
        setBanner(
          "This link opens the portal page, not a direct file. Pick another file or upload a PDF."
        );
        setPdfBase64(null);
        setFileLabel("");
        return;
      }
      setPortalLoading(true);
      setPdfBase64(null);
      setFileLabel(file.name);
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
          setBanner(
            typeof data.error === "string"
              ? data.error
              : "Could not download file."
          );
          setFileLabel("");
          return;
        }
        const base64 = data.base64;
        if (!base64 || typeof base64 !== "string") {
          setBanner("Could not download file.");
          setFileLabel("");
          return;
        }
        const name =
          (typeof data.fileName === "string" && data.fileName) || file.name;
        const contentType =
          (typeof data.contentType === "string" && data.contentType) || "";
        if (!looksLikePdf(name, contentType, base64)) {
          setBanner(MSG.pdfOnly);
          setFileLabel("");
          return;
        }
        setPdfBase64(base64);
      } catch {
        setBanner(MSG.aiUnavailable);
        setFileLabel("");
      } finally {
        setPortalLoading(false);
      }
    },
    [portalPdfCache, selectedProject, hydrateWorkspace]
  );

  useEffect(() => {
    if (manualPdfRef.current) return;
    if (!selectedPortalFileId || projectFiles.length === 0) return;
    const file = projectFiles.find((f) => f.id === selectedPortalFileId);
    if (!file) return;
    startTransition(() => {
      void loadPortalPdf(file);
    });
  }, [selectedPortalFileId, projectFiles, loadPortalPdf]);

  useEffect(() => {
    if (!hydrated || !fileKey || !selectedProject) return;
    persistPlan(fileKey, selectedProject.id, rows, planType);
  }, [rows, planType, fileKey, selectedProject, hydrated, persistPlan]);

  const onFile = useCallback(
    async (f: File | null) => {
      setBanner(null);
      manualPdfRef.current = true;
      if (!f) return;
      if (
        f.type !== "application/pdf" &&
        !f.name.toLowerCase().endsWith(".pdf")
      ) {
        setBanner(MSG.pdfOnly);
        return;
      }
      if (f.size > MAX_BYTES) {
        setBanner(MSG.tooLarge);
        return;
      }
      setSelectedPortalFileId(null);
      setFileLabel(f.name);
      setRows([]);
      try {
        const b64 = await fileToBase64(f);
        setPdfBase64(b64);
        const key = selectedProject
          ? makeFileKey(selectedProject.id, f.name)
          : makeManualFileKey(f.name, shortContentHash(b64));
        setFileKey(key);
        await hydrateWorkspace(key);
      } catch {
        setBanner(MSG.pdfOnly);
      }
    },
    [selectedProject, hydrateWorkspace]
  );

  const extract = async () => {
    if (!pdfBase64) {
      setBanner("Choose a portal PDF or upload a plan PDF first.");
      return;
    }
    setLoading(true);
    setBanner(null);
    setRows([]);
    try {
      const res = await fetch("/api/plan-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfBase64, planType, model: aiModel }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (process.env.NODE_ENV === "development" && data.debug) {
          console.error("[plan-extract]", data.code, data.debug);
        }
        const msg =
          typeof data.error === "string" ? data.error : MSG.aiUnavailable;
        const code =
          typeof data.code === "string" ? ` (${data.code})` : "";
        setBanner(msg + (process.env.NODE_ENV === "development" ? code : ""));
        return;
      }
      const list: PlanQuantityRow[] = Array.isArray(data.quantities)
        ? data.quantities
        : [];
      if (list.length === 0) {
        setBanner(MSG.noQuantities);
        return;
      }
      setRows(withIds(list));
    } catch {
      setBanner(MSG.aiUnavailable);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (id: string, quantity: number) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, quantity } : r))
    );
  };

  const sendToEstimate = () => {
    if (rows.length === 0) return;
    sendToEstimateDraft(
      rows.map((r) => ({
        item: r.item,
        quantity: r.quantity,
        unit: r.unit,
      }))
    );
  };

  const onPortalSelect = (fileId: string) => {
    manualPdfRef.current = false;
    setSelectedPortalFileId(fileId);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-surface-container-low">
      <header className="border-b border-outline-variant bg-surface-container-lowest px-margin-mobile py-4 md:px-margin-desktop">
        <h1 className="text-xl font-semibold tracking-tight text-primary md:text-2xl">
          Plan Takeoff
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Select a plan PDF from the project list (same as Spec Analysis), or
          upload manually. Extract quantities, then send to Estimate Draft.
        </p>
      </header>

      <div className="border-b border-outline-variant bg-surface-container-lowest px-margin-mobile py-4 md:px-margin-desktop">
        {banner ? (
          <div
            className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
              banner === MSG.noQuantities
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : "border-error/30 bg-error-container/40 text-error"
            }`}
          >
            {banner}
          </div>
        ) : null}

        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
          {projectFiles.length > 0 ? (
            <label className="flex min-w-[200px] flex-1 flex-col gap-1.5 text-sm font-medium text-on-surface-variant">
              Plan PDF from portal
              <select
                value={selectedPortalFileId ?? ""}
                onChange={(e) => onPortalSelect(e.target.value)}
                className="h-10 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {projectFiles.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                    {f.id === specSourceFileId ? " (spec file)" : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="text-sm text-on-surface-variant">
              No portal files in context — use Spec Analysis from a project
              first, or upload a PDF below.
            </p>
          )}

          <input
            ref={fileInput}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={pickFile}
            className="inline-flex h-10 items-center rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-sm font-medium text-primary shadow-sm hover:bg-surface-variant"
          >
            Upload plan PDF
          </button>

          <label className="flex items-center gap-2 text-sm font-medium text-on-surface-variant">
            Drawing type
            <select
              value={planType}
              onChange={(e) =>
                setPlanType(e.target.value as (typeof PLAN_TYPES)[number])
              }
              className="h-10 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {PLAN_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => void extract()}
            disabled={loading || !pdfBase64 || portalLoading}
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-on-primary shadow-sm ring-1 ring-primary/15 hover:opacity-[0.92] disabled:opacity-50"
          >
            Extract quantities
          </button>
        </div>

        {fileLabel ? (
          <p className="mt-3 text-xs text-on-surface-variant">
            Active sheet:{" "}
            <span className="font-medium text-on-surface">{fileLabel}</span>
          </p>
        ) : null}
        {portalLoading ? (
          <div className="mt-3">
            <Spinner label="Downloading PDF from portal…" />
          </div>
        ) : null}
        {loading ? (
          <div className="mt-3">
            <Spinner label="Analyzing drawing…" />
          </div>
        ) : null}
      </div>

      <section className="flex flex-1 flex-col px-margin-mobile py-6 md:px-margin-desktop">
        <h2 className="text-lg font-semibold tracking-tight text-primary">
          Quantity review
        </h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Edit quantities, then send SOV and plan lines to Estimate Draft.
          Saved takeoffs restore automatically for this file.
        </p>

        <div className="shadow-buildlens mt-4 overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 z-[1] border-b border-outline-variant bg-surface-container-low">
              <tr className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-on-surface-variant"
                  >
                    {loading
                      ? " "
                      : "Extract quantities to see plan line items (SOV lines are added when you send to Estimate Draft)."}
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr
                    key={r.id}
                    className={i % 2 === 1 ? "bg-primary/[0.02]" : ""}
                  >
                    <td className="px-4 py-3 text-on-surface">{r.item}</td>
                    <td className="px-4 py-3 font-mono text-on-surface">
                      {editingId === r.id ? (
                        <input
                          type="number"
                          className="w-28 rounded border border-outline-variant px-2 py-1"
                          value={r.quantity}
                          onChange={(e) =>
                            updateQuantity(
                              r.id,
                              Number.parseFloat(e.target.value) || 0
                            )
                          }
                          onBlur={() => setEditingId(null)}
                          autoFocus
                        />
                      ) : (
                        r.quantity
                      )}
                    </td>
                    <td className="px-4 py-3">{r.unit}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${confidenceClass(r.confidence)}`}
                      >
                        {r.confidence}
                      </span>
                      {r.notes ? (
                        <span className="ml-2 text-xs text-on-surface-variant">
                          {r.notes}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="text-xs font-semibold text-primary hover:underline"
                        onClick={() => setEditingId(r.id)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={sendToEstimate}
          disabled={rows.length === 0}
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-on-primary shadow-sm ring-1 ring-primary/15 transition-opacity hover:opacity-[0.92] disabled:opacity-40"
        >
          Send to Estimate Draft
          <Icon name="arrow_forward" size="sm" />
        </button>
      </section>
    </div>
  );
}
