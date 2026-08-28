import { fetchTopProjects, type PortalProject } from "@/lib/scraper";
import { getServiceSupabase, supabaseConfigured } from "@/lib/supabase";

async function readCache(): Promise<{
  projects: PortalProject[];
  scrapedAt: string | null;
} | null> {
  if (!supabaseConfigured()) return null;
  const sb = getServiceSupabase();
  const { data, error } = await sb
    .from("portal_bids_cache")
    .select("projects, scraped_at")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const projects = Array.isArray(data.projects)
    ? (data.projects as PortalProject[])
    : [];
  return { projects, scrapedAt: (data.scraped_at as string) ?? null };
}

async function scrapeAndSave(): Promise<{
  projects: PortalProject[];
  scrapedAt: string;
}> {
  const projects = await fetchTopProjects(25);
  const scrapedAt = new Date().toISOString();
  if (supabaseConfigured()) {
    const sb = getServiceSupabase();
    const { error } = await sb.from("portal_bids_cache").upsert({
      id: 1,
      projects,
      scraped_at: scrapedAt,
    });
    if (error) throw error;
  }
  return { projects, scrapedAt };
}

/** Cached open bids. Scrapes once if the cache is empty. */
export async function GET() {
  try {
    const cached = await readCache();
    if (cached && cached.projects.length > 0) {
      return Response.json({
        projects: cached.projects,
        scrapedAt: cached.scrapedAt,
        fromCache: true,
      });
    }
    // ponytail: cold start only — Refresh uses POST
    const fresh = await scrapeAndSave();
    return Response.json({
      projects: fresh.projects,
      scrapedAt: fresh.scrapedAt,
      fromCache: false,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to fetch projects";
    return Response.json({ error: message }, { status: 502 });
  }
}

/** Re-scrape OpenGov and overwrite the cache. */
export async function POST() {
  try {
    const fresh = await scrapeAndSave();
    return Response.json({
      projects: fresh.projects,
      scrapedAt: fresh.scrapedAt,
      fromCache: false,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to refresh projects";
    return Response.json({ error: message }, { status: 502 });
  }
}
