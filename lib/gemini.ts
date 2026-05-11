import {
  GoogleGenerativeAI,
  GoogleGenerativeAIFetchError,
} from "@google/generative-ai";

export const GEMINI_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
] as const;

export function isGeminiModelFallbackError(err: unknown): boolean {
  if (!(err instanceof GoogleGenerativeAIFetchError)) return false;
  const status = err.status ?? 0;
  return status === 404 || status === 429 || status >= 500;
}

function getGeminiApiKey(): string | undefined {
  const raw =
    process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const key = raw?.trim();
  return key || undefined;
}

export async function generatePdfText(
  pdfBase64: string,
  textPrompt: string
): Promise<string> {
  const key = getGeminiApiKey();
  if (!key) {
    throw new Error("missing_api_key");
  }
  const genAI = new GoogleGenerativeAI(key);
  let lastError: unknown;

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: "application/pdf",
            data: pdfBase64,
          },
        },
        { text: textPrompt },
      ]);
      const out = result.response.text();
      if (!out?.trim()) throw new Error("empty_response");
      return out;
    } catch (err) {
      lastError = err;
      if (!isGeminiModelFallbackError(err)) throw err;
      if (process.env.NODE_ENV === "development") {
        console.warn(`[gemini] ${modelName} unavailable; trying fallback`, err);
      }
    }
  }

  throw lastError ?? new Error("empty_response");
}
