export const AI_MODEL_IDS = ["gpt-4o-mini"] as const;

export type AiModelId = (typeof AI_MODEL_IDS)[number];

export const DEFAULT_AI_MODEL: AiModelId = "gpt-4o-mini";

const ALLOWED = new Set<string>(AI_MODEL_IDS);

export const AI_MODEL_OPTIONS: { id: AiModelId; label: string }[] = [
  { id: "gpt-4o-mini", label: "GPT-4o mini" },
];

export function parseAiModelId(raw: unknown): AiModelId {
  if (typeof raw === "string" && ALLOWED.has(raw)) {
    return raw as AiModelId;
  }
  return DEFAULT_AI_MODEL;
}
