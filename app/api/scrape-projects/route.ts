import { fetchTopProjects } from "@/lib/scraper";

export async function GET() {
  try {
    const projects = await fetchTopProjects(5);
    return Response.json({ projects });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to fetch projects";
    return Response.json({ error: message }, { status: 502 });
  }
}
