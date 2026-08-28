import { generatePdfText } from "@/lib/gemini";
import { generateWithFileSearch } from "@/lib/fileSearch";
import { geminiErrorResponse } from "@/lib/geminiErrors";
import { parseGeminiModelId } from "@/lib/geminiModels";
import type { ChatTurn } from "@/lib/types";

function buildChatPrompt(history: ChatTurn[], question: string): string {
  let conv = "";
  for (const t of history) {
    conv += `${t.role === "user" ? "User" : "Assistant"}: ${t.content}\n`;
  }
  return `You are a construction estimating assistant helping an estimator understand a specification document.
When answering questions:
- Be direct and specific
- Always cite the section number (e.g. "Section 18.2.1")
- Keep answers under 150 words
- If the answer is not in the document, say so clearly

Prior conversation:
${conv || "(none)"}

Question: ${question}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const pdfBase64 = body?.pdfBase64 as string | undefined;
    const storeName =
      typeof body?.storeName === "string" ? body.storeName : undefined;
    const fileKey =
      typeof body?.fileKey === "string" ? body.fileKey : undefined;
    const question = body?.question as string | undefined;
    const history = (body?.history ?? []) as ChatTurn[];

    if (!question || typeof question !== "string" || !question.trim()) {
      return Response.json({ error: "Please enter a question." }, { status: 400 });
    }

    const prompt = buildChatPrompt(
      Array.isArray(history) ? history : [],
      question.trim()
    );
    const model = parseGeminiModelId(body?.model);

    let answer: string;
    if (storeName && fileKey) {
      answer = await generateWithFileSearch(storeName, fileKey, prompt, model);
    } else if (pdfBase64 && typeof pdfBase64 === "string") {
      answer = await generatePdfText(pdfBase64, prompt, model);
    } else {
      return Response.json({ error: "Invalid request." }, { status: 400 });
    }

    return Response.json({ answer: answer.trim() });
  } catch (e) {
    return geminiErrorResponse(e, "api/spec-chat");
  }
}
