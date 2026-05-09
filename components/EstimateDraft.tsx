"use client";

import type { EstimateRow } from "@/lib/types";
import { useWorkspaceState } from "@/components/workspace/WorkspaceStateProvider";
import { Icon } from "@/components/ui/Icon";

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `row-${Date.now()}-${Math.random()}`;
}

export function EstimateDraft() {
  const { estimateRows: rows, setEstimateRows: onChange } = useWorkspaceState();

  const setRow = (id: string, patch: Partial<EstimateRow>) => {
    onChange(
      rows.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  };

  const addRow = () => {
    onChange([
      ...rows,
      {
        id: newId(),
        item: "",
        quantity: 0,
        unit: "",
        unitPrice: 0,
      },
    ]);
  };

  const removeRow = (id: string) => {
    onChange(rows.filter((r) => r.id !== id));
  };

  const grandTotal = rows.reduce(
    (sum, r) => sum + r.quantity * r.unitPrice,
    0
  );

  const exportCsv = () => {
    const header = ["Item", "Quantity", "Unit", "Unit Price", "Total"];
    const lines = [
      header.join(","),
      ...rows.map((r) => {
        const total = r.quantity * r.unitPrice;
        const esc = (s: string | number) => {
          const t = String(s);
          if (/[",\n]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
          return t;
        };
        return [
          esc(r.item),
          esc(r.quantity),
          esc(r.unit),
          esc(r.unitPrice),
          esc(total),
        ].join(",");
      }),
      ["", "", "", "Grand Total", grandTotal].join(","),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "buildlens-estimate.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] px-margin-mobile pb-24 pt-6 md:px-margin-desktop md:pb-32 md:pt-8">
      <header className="mb-stack-lg flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-primary sm:text-3xl md:text-[2rem] md:leading-tight">
            Estimate Draft
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant md:text-[0.9375rem]">
            Review and refine AI-generated quantities and pricing for the
            Terminal Expansion project.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-outline-variant bg-white px-4 text-sm font-medium text-primary shadow-sm hover:bg-surface-container"
          >
            <Icon name="history" size="md" className="text-primary" />
            Version history
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={rows.length === 0}
            className="shadow-buildlens inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary shadow-sm ring-1 ring-primary/15 hover:opacity-[0.92] disabled:opacity-50"
          >
            <Icon name="download" size="md" className="text-on-primary" />
            Export Excel / CSV
          </button>
        </div>
      </header>

      <div className="shadow-buildlens overflow-hidden rounded-xl border border-outline-variant bg-white">
        <div className="overflow-x-auto">
          <table className="zebra-table min-w-full text-left">
            <thead className="border-b border-outline-variant bg-surface-container-low">
              <tr className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
              <th className="whitespace-nowrap px-4 py-3 text-primary">
                Bid item description
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-primary">
                Quantity
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-primary">Unit</th>
              <th className="whitespace-nowrap px-4 py-3 text-primary">
                Unit price
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-primary">
                Extended total
              </th>
              <th className="px-4 py-3" aria-label="Actions" />
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-outline-variant">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-on-surface-variant"
                >
                  Use &quot;Send to estimate draft&quot; from Plan Takeoff, or add
                  a row manually.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const lineTotal = r.quantity * r.unitPrice;
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-2">
                      <input
                        className="w-full min-w-[10rem] rounded border border-outline-variant bg-white px-2 py-1.5 text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                        value={r.item}
                        onChange={(e) =>
                          setRow(r.id, { item: e.target.value })
                        }
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        className="font-mono w-24 rounded border border-outline-variant px-2 py-1.5 text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                        value={Number.isNaN(r.quantity) ? "" : r.quantity}
                        onChange={(e) =>
                          setRow(r.id, {
                            quantity: Number.parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        className="font-mono w-20 rounded border border-outline-variant px-2 py-1.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                        value={r.unit}
                        onChange={(e) =>
                          setRow(r.id, { unit: e.target.value })
                        }
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className="font-mono w-28 rounded border border-outline-variant px-2 py-1.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                        value={r.unitPrice === 0 ? "" : r.unitPrice}
                        placeholder="0"
                        onChange={(e) =>
                          setRow(r.id, {
                            unitPrice: Number.parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </td>
                    <td className="px-4 py-2 font-mono text-on-surface">
                      {lineTotal.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        className="text-sm font-medium text-error hover:underline"
                        onClick={() => removeRow(r.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      <div className="mt-stack-lg flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={addRow}
          className="inline-flex h-10 items-center rounded-lg border border-outline-variant bg-white px-4 text-sm font-medium text-primary shadow-sm hover:bg-surface-container"
        >
          Add row
        </button>
        <div className="ml-auto text-right">
          <p className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
            Grand total
          </p>
          <p className="text-2xl font-semibold text-primary">
            {grandTotal.toLocaleString(undefined, {
              style: "currency",
              currency: "USD",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
