"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { EstimateRow } from "@/lib/types";

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `est-${Date.now()}-${Math.random()}`;
}

type WorkspaceCtx = {
  estimateRows: EstimateRow[];
  setEstimateRows: React.Dispatch<React.SetStateAction<EstimateRow[]>>;
  appendFromPlan: (
    items: { item: string; quantity: number; unit: string }[]
  ) => void;
};

const Ctx = createContext<WorkspaceCtx | null>(null);

export function WorkspaceStateProvider({ children }: { children: ReactNode }) {
  const [estimateRows, setEstimateRows] = useState<EstimateRow[]>([]);

  const appendFromPlan = useCallback(
    (items: { item: string; quantity: number; unit: string }[]) => {
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

  const value = useMemo(
    () => ({ estimateRows, setEstimateRows, appendFromPlan }),
    [estimateRows, appendFromPlan]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWorkspaceState() {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error("useWorkspaceState must be used within WorkspaceStateProvider");
  }
  return v;
}
