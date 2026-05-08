"use client";

import { useCallback, useRef, useState } from "react";
import { fileToBase64 } from "@/lib/fileBase64";
import { MSG } from "@/lib/messages";
import type { PlanQuantityRow } from "@/lib/types";
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
    return "bg-[#22C55E]/15 text-[#166534] ring-1 ring-[#22C55E]/40";
  if (v === "medium")
    return "bg-amber-50 text-amber-900 ring-1 ring-[#F59E0B]/50";
  return "bg-red-50 text-red-800 ring-1 ring-[#EF4444]/40";
}

type Props = {
  onSendToEstimate: (rows: { item: string; quantity: number; unit: string }[]) => void;
};

export function PlanReader({ onSendToEstimate }: Props) {
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
    onSendToEstimate(
      rows.map((r) => ({
        item: r.item,
        quantity: r.quantity,
        unit: r.unit,
      }))
    );
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-[#1E3A5F]">
        2. Plan Reader
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Upload a drawing sheet, choose a plan type, and extract quantities for
        takeoff review.
      </p>

      {banner ? (
        <p
          className={`mt-4 rounded-md px-3 py-2 text-sm ${
            banner === MSG.noQuantities
              ? "bg-amber-50 text-amber-900"
              : "bg-red-50 text-[#EF4444]"
          }`}
        >
          {banner}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-end gap-4">
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
          className="rounded-md bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Upload plan PDF
        </button>
        {fileLabel ? (
          <span className="text-sm text-slate-700">{fileLabel}</span>
        ) : null}

        <label className="flex flex-col text-xs font-medium text-slate-600">
          Plan type
          <select
            value={planType}
            onChange={(e) =>
              setPlanType(e.target.value as (typeof PLAN_TYPES)[number])
            }
            className="mt-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
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
          className="rounded-md bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Extract quantities
        </button>
        {loading ? <Spinner label="Analyzing drawing…" /> : null}
      </div>

      <div className="mt-6 overflow-x-auto rounded-md border border-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="px-3 py-2 font-medium">Item</th>
              <th className="px-3 py-2 font-medium">Quantity</th>
              <th className="px-3 py-2 font-medium">Unit</th>
              <th className="px-3 py-2 font-medium">Confidence</th>
              <th className="px-3 py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-8 text-center text-slate-500"
                >
                  {loading
                    ? " "
                    : "Extract quantities to see line items here."}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-slate-800">{r.item}</td>
                  <td className="px-3 py-2">
                    {editingId === r.id ? (
                      <input
                        type="number"
                        className="w-28 rounded border border-slate-300 px-2 py-1 text-slate-900"
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
                      <span className="text-slate-800">{r.quantity}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-800">{r.unit}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${confidenceClass(r.confidence)}`}
                    >
                      {r.confidence}
                    </span>
                    {r.notes ? (
                      <span className="ml-2 text-xs text-slate-500">
                        {r.notes}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="text-sm font-medium text-[#1E3A5F] hover:underline"
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

      <div className="mt-4">
        <button
          type="button"
          onClick={sendToEstimate}
          disabled={rows.length === 0}
          className="rounded-md bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Send to estimate
        </button>
      </div>
    </section>
  );
}
