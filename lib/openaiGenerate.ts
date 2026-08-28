import OpenAI from "openai";
import { DEFAULT_AI_MODEL, parseAiModelId } from "@/lib/aiModels";

export async function generatePdfText(
  openaiApiKey: string,
  pdfBase64: string,
  textPrompt: string,
  modelId: unknown = DEFAULT_AI_MODEL
): Promise<string> {
  const openai = new OpenAI({ apiKey: openaiApiKey });
  const model = parseAiModelId(modelId);
  const response = await openai.responses.create({
    model,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_file",
            filename: "document.pdf",
            file_data: `data:application/pdf;base64,${pdfBase64}`,
          },
          { type: "input_text", text: textPrompt },
        ],
      },
    ],
  });
  const out = response.output_text;
  if (!out?.trim()) throw new Error("empty_response");
  return out;
}

export async function generateText(
  openaiApiKey: string,
  textPrompt: string,
  modelId: unknown = DEFAULT_AI_MODEL
): Promise<string> {
  const openai = new OpenAI({ apiKey: openaiApiKey });
  const model = parseAiModelId(modelId);
  const response = await openai.responses.create({
    model,
    input: textPrompt,
  });
  const out = response.output_text;
  if (!out?.trim()) throw new Error("empty_response");
  return out;
}
