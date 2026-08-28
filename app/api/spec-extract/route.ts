import { generatePdfText } from "@/lib/gemini";
import { generateWithFileSearch } from "@/lib/fileSearch";
import { geminiErrorResponse } from "@/lib/geminiErrors";
import { parseGeminiModelId } from "@/lib/geminiModels";
import { MSG } from "@/lib/messages";
import { parseJsonArray } from "@/lib/parseJson";
import type { SovRow } from "@/lib/types";

const SOV_PROMPT = `You are a construction estimating assistant.
Read this construction specification document.
Find the Schedule of Values or Bid Schedule section.
Return ONLY a JSON array with this structure:
[
{ "item": "18 inch PVC Water Main", "unit": "LF", "quantity": 500 },
{ "item": "Concrete Sidewalk", "unit": "SY", "quantity": 320 }
]
If you cannot find a Schedule of Values, return an empty array [].
Do not include any other text.`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const pdfBase64 = body?.pdfBase64 as string | undefined;
    const storeName =
      typeof body?.storeName === "string" ? body.storeName : undefined;
    const fileKey =
      typeof body?.fileKey === "string" ? body.fileKey : undefined;
    const model = parseGeminiModelId(body?.model);

    let raw: string;
    if (storeName && fileKey) {
      raw = await generateWithFileSearch(storeName, fileKey, SOV_PROMPT, model);
    } else if (pdfBase64 && typeof pdfBase64 === "string") {
      raw = await generatePdfText(pdfBase64, SOV_PROMPT, model);
    } else {
      return Response.json({ error: "Invalid request." }, { status: 400 });
    }

    let rows: SovRow[];
    try {
      rows = parseJsonArray<SovRow>(raw);
    } catch {
      return Response.json({ error: MSG.extractFailed }, { status: 422 });
    }

    const normalized = rows
      .filter(
        (r) =>
          r &&
          typeof r.item === "string" &&
          typeof r.unit === "string" &&
          typeof r.quantity === "number"
      )
      .map((r) => ({
        item: r.item,
        unit: r.unit,
        quantity: r.quantity,
      }));

    return Response.json({ schedule: normalized });
  } catch (e) {
    return geminiErrorResponse(e, "api/spec-extract");
  }
}
