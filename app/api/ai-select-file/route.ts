import { generateText } from "@/lib/openaiGenerate";
import { openaiErrorResponse } from "@/lib/openaiErrors";
import { parseAiModelId } from "@/lib/aiModels";
import { isAuthError, requireUser } from "@/lib/auth";
import { resolveOpenAiApiKey } from "@/lib/userOpenAiKey";
import type { ProjectFile } from "@/lib/scraper";

const PROMPT = `You are a construction estimating assistant. Given a list of files from a procurement project, select the SINGLE file most likely to contain the technical specifications or Schedule of Values (SOV) for construction bidding. Prefer PDFs with names suggesting specs, bid schedules, scope of work, or technical requirements.

Return ONLY a JSON object:
{"selectedId": "<the id of the best file>", "reason": "<brief explanation why>"}

Files:
`;

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (isAuthError(auth)) return auth;
    const { supabase, user } = auth;

    const body = await request.json();
    const files = body?.files as ProjectFile[] | undefined;
    const projectTitle = body?.projectTitle as string | undefined;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return Response.json(
        { error: "files array is required" },
        { status: 400 }
      );
    }

    const fileList = files
      .map((f) => `- ID: ${f.id} | Name: ${f.name} | Type: ${f.type}`)
      .join("\n");

    const contextLine = projectTitle
      ? `\nProject: "${projectTitle}"\n`
      : "";

    const openaiApiKey = await resolveOpenAiApiKey(supabase, user.id);
    const model = parseAiModelId(body?.model);
    const text = await generateText(
      openaiApiKey,
      PROMPT + contextLine + fileList,
      model
    );

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
    return openaiErrorResponse(e, "api/ai-select-file");
  }
}
