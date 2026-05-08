"use client";

import type { EstimateRow } from "@/lib/types";

type Props = {
  rows: EstimateRow[];
  onChange: (rows: EstimateRow[]) => void;
};

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `row-${Date.now()}-${Math.random()}`;
}

export function EstimateDraft({ rows, onChange }: Props) {
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
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-[#1E3A5F]">
        3. Estimate draft
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Quantities from the plan reader flow here. Add unit prices to build your
        bid totals.
      </p>

      <div className="mt-4 overflow-x-auto rounded-md border border-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="px-3 py-2 font-medium">Item</th>
              <th className="px-3 py-2 font-medium">Quantity</th>
              <th className="px-3 py-2 font-medium">Unit</th>
              <th className="px-3 py-2 font-medium">Unit price</th>
              <th className="px-3 py-2 font-medium">Total</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-8 text-center text-slate-500"
                >
                  Use &quot;Send to estimate&quot; from the plan reader, or add
                  a row manually.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const lineTotal = r.quantity * r.unitPrice;
                return (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">
                      <input
                        className="w-full min-w-[10rem] rounded border border-slate-300 px-2 py-1 text-slate-900"
                        value={r.item}
                        onChange={(e) =>
                          setRow(r.id, { item: e.target.value })
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className="w-24 rounded border border-slate-300 px-2 py-1 text-slate-900"
                        value={Number.isNaN(r.quantity) ? "" : r.quantity}
                        onChange={(e) =>
                          setRow(r.id, {
                            quantity: Number.parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="w-20 rounded border border-slate-300 px-2 py-1 text-slate-900"
                        value={r.unit}
                        onChange={(e) =>
                          setRow(r.id, { unit: e.target.value })
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className="w-28 rounded border border-slate-300 px-2 py-1 text-slate-900"
                        value={r.unitPrice === 0 ? "" : r.unitPrice}
                        placeholder="0"
                        onChange={(e) =>
                          setRow(r.id, {
                            unitPrice: Number.parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-slate-800">
                      {lineTotal.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="text-sm text-red-600 hover:underline"
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

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={addRow}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-[#1E3A5F] hover:bg-slate-50"
        >
          Add row
        </button>
        <button
          type="button"
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="rounded-md bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Export to CSV
        </button>
        <div className="ml-auto text-right">
          <p className="text-xs font-medium uppercase text-slate-500">
            Grand total
          </p>
          <p className="text-lg font-semibold text-[#1E3A5F]">
            {grandTotal.toLocaleString(undefined, {
              style: "currency",
              currency: "USD",
            })}
          </p>
        </div>
      </div>
    </section>
  );
}
