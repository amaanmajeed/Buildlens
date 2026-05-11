import type { PlanQuantityRow, SovRow } from "@/lib/types";

export function demoFallbacksEnabled() {
  return process.env.BUILDLENS_DEMO_FALLBACKS === "1";
}

export const demoSovRows: SovRow[] = [
  { item: "Aluminum replacement windows", quantity: 41, unit: "EA" },
  { item: "Exterior joint reseal", quantity: 1280, unit: "LF" },
  { item: "Interior trim repair", quantity: 41, unit: "EA" },
  { item: "Final cleaning and punch list", quantity: 1, unit: "LS" },
];

export function demoPlanRows(planType: string): PlanQuantityRow[] {
  const scope = planType === "Other" ? "Window" : planType;
  return [
    {
      item: `${scope} sheet window openings`,
      quantity: 41,
      unit: "EA",
      confidence: "high",
      notes: "Window tags counted from drawings",
    },
    {
      item: "Sealant at exterior frames",
      quantity: 1280,
      unit: "LF",
      confidence: "medium",
      notes: "Scaled from exterior elevations",
    },
    {
      item: "Temporary protection",
      quantity: 820,
      unit: "SF",
      confidence: "medium",
      notes: "Area estimate from work zones",
    },
  ];
}
