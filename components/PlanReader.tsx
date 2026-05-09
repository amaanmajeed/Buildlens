"use client";

import { useCallback, useRef, useState } from "react";
import { fileToBase64 } from "@/lib/fileBase64";
import { MSG } from "@/lib/messages";
import type { PlanQuantityRow } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { useWorkspaceState } from "@/components/workspace/WorkspaceStateProvider";
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

export function PlanReader() {
  const { appendFromPlan } = useWorkspaceState();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [fileLabel, setFileLabel] = useState("");
  const [planType, setPlanType] =
    useState<(typeof PLAN_TYPES)[number]>("Paving");
  const [rows, setRows] = useState<LocalRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const pickFile = () => fileInput.current?.click();

  const onFile = useCallback(async (f: File | null) => {
    setBanner(null);
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      setBanner(MSG.pdfOnly);
      return;
    }
    if (f.size > MAX_BYTES) {
      setBanner(MSG.tooLarge);
      return;
    }
    setFileLabel(f.name);
    setRows([]);
    try {
      const b64 = await fileToBase64(f);
      setPdfBase64(b64);
    } catch {
      setBanner(MSG.pdfOnly);
    }
  }, []);

  const extract = async () => {
    if (!pdfBase64) {
      setBanner("Upload a plan PDF first.");
      return;
    }
    setLoading(true);
    setBanner(null);
    setRows([]);
    try {
      const res = await fetch("/api/plan-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfBase64, planType }),
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
      setRows(
        list.map((r) => ({
          ...r,
          id:
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `${r.item}-${r.quantity}-${Math.random()}`,
        }))
      );
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
    appendFromPlan(
      rows.map((r) => ({
        item: r.item,
        quantity: r.quantity,
        unit: r.unit,
      }))
    );
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col overflow-hidden md:flex-row">
      <section className="flex min-h-[40vh] w-full flex-[0_0_auto] flex-col border-b border-outline-variant bg-white md:w-[65%] md:max-w-[65%] md:flex-initial md:border-b-0 md:border-r">
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-4">
          <div className="flex min-w-0 items-center gap-stack-sm overflow-hidden">
            <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
              {fileLabel
                ? `Sheet: ${fileLabel}`
                : "Sheet — upload plan PDF"}
            </span>
            <div className="flex shrink-0 overflow-hidden rounded-lg border border-outline-variant bg-white shadow-sm">
              <button
                type="button"
                className="border-r border-outline-variant px-2.5 py-2 text-on-surface-variant transition-colors hover:bg-surface-variant"
                aria-label="Zoom in"
              >
                <Icon name="zoom_in" size="sm" />
              </button>
              <button
                type="button"
                className="px-2.5 py-2 text-on-surface-variant transition-colors hover:bg-surface-variant"
                aria-label="Zoom out"
              >
                <Icon name="zoom_out" size="sm" />
              </button>
            </div>
          </div>
        </div>
        <div className="blueprint-canvas flex min-h-[200px] flex-1 flex-col items-center justify-center gap-6 p-margin-mobile md:p-8">
          {banner ? (
            <div
              className={`mx-auto max-w-md rounded-lg border px-4 py-3 text-sm ${
                banner === MSG.noQuantities
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : "border-error/30 bg-error-container/40 text-error"
              }`}
            >
              {banner}
            </div>
          ) : null}
          <input
            ref={fileInput}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
          />
          <div className="flex flex-col items-center gap-4">
            <p className="text-center text-sm text-on-surface-variant">
              Upload drawing sheet PDF and extract quantities for takeoff
              review.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={pickFile}
                className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-on-primary shadow-sm ring-1 ring-primary/15 hover:opacity-[0.92]"
              >
                Upload plan PDF
              </button>
              <label className="flex items-center gap-2 text-sm font-medium text-on-surface-variant">
                Type
                <select
                  value={planType}
                  onChange={(e) =>
                    setPlanType(e.target.value as (typeof PLAN_TYPES)[number])
                  }
                  className="h-10 rounded-lg border border-outline-variant bg-white px-3 text-sm text-on-surface shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                disabled={loading || !pdfBase64}
                className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-on-primary shadow-sm ring-1 ring-primary/15 hover:opacity-[0.92] disabled:opacity-50"
              >
                Extract quantities
              </button>
            </div>
            {loading ? <Spinner label="Analyzing drawing…" /> : null}
          </div>
        </div>
      </section>

      <section className="flex min-h-[40vh] flex-1 flex-col overflow-hidden bg-surface-container-low">
        <header className="border-b border-outline-variant bg-white px-margin-mobile py-4 md:px-margin-desktop">
          <h2 className="text-lg font-semibold tracking-tight text-primary">
            Quantity review
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Edit quantities, then push to Estimate Draft.
          </p>
        </header>
        <div className="min-h-0 flex-1 overflow-auto p-margin-mobile pb-8 md:p-margin-desktop">
          <div className="shadow-buildlens overflow-hidden rounded-lg border border-outline-variant bg-white">
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
                      {loading ? " " : "Extract quantities to see line items."}
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
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-on-primary shadow-sm ring-1 ring-primary/15 transition-opacity hover:opacity-[0.92] disabled:opacity-40 md:w-auto"
          >
            Send to estimate draft
          </button>
        </div>
      </section>
    </div>
  );
}
