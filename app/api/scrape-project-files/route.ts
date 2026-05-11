import { fetchProjectFiles } from "@/lib/scraper";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const projectId = body?.projectId as number | undefined;
    const addendumIds = (body?.addendumIds as number[]) ?? [];
    const projectTitle = (body?.projectTitle as string) ?? "";

    if (!projectId || typeof projectId !== "number") {
      return Response.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }
    const files = await fetchProjectFiles(projectId, addendumIds, projectTitle);
    return Response.json({ files });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to fetch project files";
    return Response.json({ error: message }, { status: 502 });
  }
}
