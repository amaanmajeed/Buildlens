export const GEMINI_MODEL_IDS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-3-flash-preview",
  "gemini-3.1-flash",
  "gemini-3.1-flash-lite",
] as const;

export type GeminiModelId = (typeof GEMINI_MODEL_IDS)[number];

export const DEFAULT_GEMINI_MODEL: GeminiModelId = "gemini-2.5-flash";

const ALLOWED = new Set<string>(GEMINI_MODEL_IDS);

/** Server-side Gemini routes only; UI picker is OpenAI (`lib/aiModels`). */
export function parseGeminiModelId(raw: unknown): GeminiModelId {
  if (typeof raw === "string" && ALLOWED.has(raw)) {
    return raw as GeminiModelId;
  }
  return DEFAULT_GEMINI_MODEL;
}
