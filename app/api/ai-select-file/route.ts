import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ProjectFile } from "@/lib/scraper";

const MODEL = "gemini-2.5-flash-lite";

const PROMPT = `You are a construction estimating assistant. Given a list of files from a procurement project, select the SINGLE file most likely to contain the technical specifications or Schedule of Values (SOV) for construction bidding. Prefer PDFs with names suggesting specs, bid schedules, scope of work, or technical requirements.

Return ONLY a JSON object:
{"selectedId": "<the id of the best file>", "reason": "<brief explanation why>"}

Files:
`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const files = body?.files as ProjectFile[] | undefined;
    const projectTitle = body?.projectTitle as string | undefined;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return Response.json(
        { error: "files array is required" },
        { status: 400 }
      );
    }

    const key =
      process.env.GEMINI_API_KEY?.trim() ??
      process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();

    if (!key) {
      return Response.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const fileList = files
      .map((f) => `- ID: ${f.id} | Name: ${f.name} | Type: ${f.type}`)
      .join("\n");

    const contextLine = projectTitle
      ? `\nProject: "${projectTitle}"\n`
      : "";

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: MODEL });
    const result = await model.generateContent(
      PROMPT + contextLine + fileList
    );
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      return Response.json(
        { error: "AI returned invalid format" },
        { status: 422 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      selectedId: string;
      reason: string;
    };

    return Response.json({
      selectedId: parsed.selectedId,
      reason: parsed.reason,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "AI file selection failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
