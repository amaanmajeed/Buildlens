export type SovRow = {
  item: string;
  unit: string;
  quantity: number;
};

export type PlanQuantityRow = {
  item: string;
  quantity: number;
  unit: string;
  confidence: "high" | "medium" | "low" | string;
  notes?: string;
};

export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

export type EstimateRow = {
  id: string;
  item: string;
  quantity: number;
  unit: string;
  unitPrice: number;
};
