import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = "gemini-2.5-flash-lite";

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
  const model = genAI.getGenerativeModel({ model: MODEL });
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
}
