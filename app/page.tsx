"use client";

import { useCallback, useState } from "react";
import { EstimateDraft } from "@/components/EstimateDraft";
import { PlanReader } from "@/components/PlanReader";
import { SpecReader } from "@/components/SpecReader";
import type { EstimateRow } from "@/lib/types";

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `est-${Date.now()}-${Math.random()}`;
}

export default function Home() {
  const [estimateRows, setEstimateRows] = useState<EstimateRow[]>([]);

  const appendFromPlan = useCallback(
    (
      items: { item: string; quantity: number; unit: string }[]
    ) => {
      setEstimateRows((prev) => [
        ...prev,
        ...items.map((x) => ({
          id: newId(),
          item: x.item,
          quantity: x.quantity,
          unit: x.unit,
          unitPrice: 0,
        })),
      ]);
    },
    []
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="bg-[#1E3A5F] px-6 py-4 text-white shadow">
        <h1 className="text-xl font-semibold tracking-tight">BuildLens AI</h1>
        <p className="text-sm text-blue-100">
          Specification chat, plan takeoff, and estimate draft — proof of concept
        </p>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-10 px-4 py-8">
        <SpecReader />
        <PlanReader onSendToEstimate={appendFromPlan} />
        <EstimateDraft rows={estimateRows} onChange={setEstimateRows} />
      </main>
    </div>
  );
}
