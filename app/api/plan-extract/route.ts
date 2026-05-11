import { generatePdfText } from "@/lib/gemini";
import { geminiErrorResponse } from "@/lib/geminiErrors";
import { MSG } from "@/lib/messages";
import { parseJsonArray } from "@/lib/parseJson";
import { demoFallbacksEnabled, demoPlanRows } from "@/lib/demoFallbacks";
import type { PlanQuantityRow } from "@/lib/types";

const PLAN_TYPES = new Set([
  "Paving",
  "Utility",
  "Signalization",
  "Drainage",
  "Other",
]);

function planPrompt(planType: string) {
  return `You are a construction quantity takeoff assistant.
This is a ${planType} construction drawing.
Extract all measurable quantities from this drawing.
Look for:
- Dimensions and measurements labeled on the drawing
- Quantity notes and callouts
- Legend items with counts
- Any tabulated data on the sheet

Return ONLY a JSON array:
[
{
"item": "18 inch PVC Water Main",
"quantity": 487,
"unit": "LF",
"confidence": "high",
"notes": "From sheet dimension callout"
}
]
Confidence values: high, medium, low
Do not include any other text.`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const pdfBase64 = body?.pdfBase64 as string | undefined;
    const planType = body?.planType as string | undefined;

    if (!pdfBase64 || typeof pdfBase64 !== "string") {
      return Response.json({ error: "Invalid request." }, { status: 400 });
    }
    const pt =
      planType && PLAN_TYPES.has(planType) ? planType : "Other";
    if (demoFallbacksEnabled()) {
      return Response.json({ quantities: demoPlanRows(pt) });
    }

    const raw = await generatePdfText(pdfBase64, planPrompt(pt));
    let rows: PlanQuantityRow[];
    try {
      rows = parseJsonArray<PlanQuantityRow>(raw);
    } catch {
      return Response.json({ error: MSG.extractFailed }, { status: 422 });
    }

    const normalized: PlanQuantityRow[] = rows
      .filter(
        (r) =>
          r &&
          typeof r.item === "string" &&
          typeof r.quantity === "number" &&
          typeof r.unit === "string" &&
          typeof r.confidence === "string"
      )
      .map((r) => ({
        item: r.item,
        quantity: r.quantity,
        unit: r.unit,
        confidence: r.confidence.toLowerCase(),
        notes: typeof r.notes === "string" ? r.notes : undefined,
      }));

    return Response.json({ quantities: normalized });
  } catch (e) {
    return geminiErrorResponse(e, "api/plan-extract");
  }
}
