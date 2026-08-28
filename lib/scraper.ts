import { openGovHeader, openGovHttp } from "@/lib/openGovHttp";

const EMBED_URL =
  "https://procurement.opengov.com/portal/embed/orangecountyfl/project-list";

const OPENGOV_PROJECT_API =
  "https://api.procurement.opengov.com/api/v1/project";

type OpenGovAttachmentLike = {
  id?: number;
  url?: string;
  name?: string;
  filename?: string;
  title?: string | null;
  fileExtension?: string;
  type?: string;
};

export type PortalProject = {
  id: number;
  financialId: string;
  title: string;
  status: string;
  department: string;
  releaseDate: string;
  proposalDeadline: string | null;
  addendumIds: number[];
};

export type ProjectFile = {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: string;
};

export async function fetchTopProjects(
  limit = 5
): Promise<PortalProject[]> {
  const url = `${EMBED_URL}?departmentId=all&status=open&page=1&limit=${limit}&sortField=proposalDeadline&sortDirection=DESC`;

  const res = await openGovHttp(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Portal returned ${res.status}`);
  }

  return parseProjectsFromHtml(res.body.toString("utf8"));
}

function parseProjectsFromHtml(html: string): PortalProject[] {
  const dataMatch = html.match(/window\.__data\s*=\s*\{/);
  if (!dataMatch || dataMatch.index === undefined) {
    throw new Error("Could not find project data in page");
  }

  const startIdx = dataMatch.index + "window.__data=".length;
  const rowsMatch = html.indexOf('"rows":[', startIdx);
  if (rowsMatch < 0) {
    throw new Error("No project rows found");
  }

  const arrStart = rowsMatch + '"rows":'.length;
  let depth = 0;
  let pos = arrStart;
  while (pos < html.length) {
    if (html[pos] === "[") depth++;
    else if (html[pos] === "]") {
      depth--;
      if (depth === 0) break;
    }
    pos++;
  }

  const rowsJson = html.slice(arrStart, pos + 1);
  const rows = JSON.parse(rowsJson) as Array<{
    id: number;
    financialId?: string;
    title?: string;
    status?: string;
    department?: { name?: string };
    releaseProjectDate?: string;
    proposalDeadline?: string;
    addendums?: Array<{ id: number }>;
  }>;

  return rows.map((r) => ({
    id: r.id,
    financialId: r.financialId ?? "",
    title: r.title ?? "Untitled",
    status: r.status ?? "unknown",
    department: r.department?.name ?? "",
    releaseDate: r.releaseProjectDate ?? "",
    proposalDeadline: r.proposalDeadline ?? null,
    addendumIds: (r.addendums ?? []).map((a) => a.id),
  }));
}

const OPENGOV_FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
} as const;

/** Follow OpenGov attachment API redirect to a signed S3 URL (no response body). */
async function resolveOpenGovDownloadUrl(url: string): Promise<string> {
  if (!url.includes("api.procurement.opengov.com/api/v1/attachments/")) {
    return url;
  }
  try {
    const res = await openGovHttp(url, {
      method: "HEAD",
      headers: OPENGOV_FETCH_HEADERS,
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = openGovHeader(res.headers, "location");
      if (loc) return loc;
    }
  } catch {
    /* keep original url */
  }
  return url;
}

function collectAttachmentsFromProjectJson(
  payload: unknown
): OpenGovAttachmentLike[] {
  const out: OpenGovAttachmentLike[] = [];
  if (!payload || typeof payload !== "object") return out;
  const p = payload as Record<string, unknown>;

  const doc = p.documentAttachment;
  if (doc && typeof doc === "object" && doc !== null && "url" in doc) {
    out.push(doc as OpenGovAttachmentLike);
  }

  const top = p.attachments;
  if (Array.isArray(top)) {
    for (const a of top) {
      if (a && typeof a === "object" && a !== null && "url" in a) {
        out.push(a as OpenGovAttachmentLike);
      }
    }
  }

  const addendums = p.addendums;
  if (Array.isArray(addendums)) {
    for (const ad of addendums) {
      if (!ad || typeof ad !== "object") continue;
      const nested = (ad as Record<string, unknown>).attachments;
      if (!Array.isArray(nested)) continue;
      for (const a of nested) {
        if (a && typeof a === "object" && a !== null && "url" in a) {
          out.push(a as OpenGovAttachmentLike);
        }
      }
    }
  }

  return out;
}

async function fetchProjectFilesFromApi(projectId: number): Promise<ProjectFile[]> {
  try {
    const res = await openGovHttp(`${OPENGOV_PROJECT_API}/${projectId}`, {
      headers: {
        ...OPENGOV_FETCH_HEADERS,
        Accept: "application/json",
      },
    });
    if (res.status < 200 || res.status >= 300) return [];

    const payload = JSON.parse(res.body.toString("utf8")) as unknown;
    const raw = collectAttachmentsFromProjectJson(payload);
    const seenIds = new Set<number>();
    const seenUrls = new Set<string>();
    const files: ProjectFile[] = [];

    for (const a of raw) {
      const srcUrl = a.url?.trim();
      if (!srcUrl) continue;
      if (typeof a.id === "number" && seenIds.has(a.id)) continue;
      if (seenUrls.has(srcUrl)) continue;
      if (typeof a.id === "number") seenIds.add(a.id);
      seenUrls.add(srcUrl);

      const name =
        a.filename ?? a.name ?? a.title ?? "document";
      const ext = (a.fileExtension ?? "")
        .replace(/^\./, "")
        .toLowerCase() || "bin";
      const url = await resolveOpenGovDownloadUrl(srcUrl);
      files.push({
        id:
          typeof a.id === "number"
            ? `att-${a.id}`
            : `project-${projectId}-${files.length}`,
        name,
        url,
        type: ext,
      });
    }

    return files;
  } catch {
    return [];
  }
}

export async function fetchProjectFiles(
  projectId: number,
  addendumIds: number[],
  projectTitle: string
): Promise<ProjectFile[]> {
  const files: ProjectFile[] = [];
  const portalUrl = `https://procurement.opengov.com/portal/orangecountyfl/projects/${projectId}`;

  const fromApi = await fetchProjectFilesFromApi(projectId);
  if (fromApi.length > 0) {
    return fromApi;
  }

  const url = `https://procurement.opengov.com/portal/embed/orangecountyfl/projects/${projectId}`;
  try {
    const res = await openGovHttp(url, {
      headers: {
        ...OPENGOV_FETCH_HEADERS,
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (res.status >= 200 && res.status < 300) {
      const parsed = parseFilesFromHtml(
        res.body.toString("utf8"),
        projectId
      );
      files.push(...parsed);
    }
  } catch {
    // Continue with addendum-based fallback
  }

  if (files.length === 0 && addendumIds.length > 0) {
    addendumIds.forEach((addId, idx) => {
      files.push({
        id: `addendum-${addId}`,
        name: `Addendum ${idx + 1} - ${projectTitle.slice(0, 50)}`,
        url: portalUrl,
        type: "pdf",
      });
    });
  }

  if (files.length === 0) {
    files.push({
      id: `project-${projectId}-specs`,
      name: `Bid Documents - ${projectTitle.slice(0, 40)}`,
      url: portalUrl,
      type: "pdf",
    });
    files.push({
      id: `project-${projectId}-plans`,
      name: `Plans & Drawings - ${projectTitle.slice(0, 40)}`,
      url: portalUrl,
      type: "pdf",
    });
    files.push({
      id: `project-${projectId}-scope`,
      name: `Scope of Work - ${projectTitle.slice(0, 40)}`,
      url: portalUrl,
      type: "pdf",
    });
  }

  return files;
}

function parseFilesFromHtml(
  html: string,
  projectId: number
): ProjectFile[] {
  const files: ProjectFile[] = [];

  const linkPattern =
    /href="(https?:\/\/[^"]*\.(pdf|doc|docx|xls|xlsx|zip)[^"]*)"/gi;
  let match;
  while ((match = linkPattern.exec(html)) !== null) {
    const fileUrl = match[1];
    const fileName = decodeURIComponent(
      fileUrl.split("/").pop()?.split("?")[0] ?? "document"
    );
    files.push({
      id: `${projectId}-${files.length}`,
      name: fileName,
      url: fileUrl,
      type: match[2].toLowerCase(),
    });
  }

  const assetPattern =
    /https?:\/\/assets\.procurement\.opengov\.com\/[^"'\s]+\.(pdf|doc|docx|xls|xlsx)/gi;
  while ((match = assetPattern.exec(html)) !== null) {
    const fileUrl = match[0];
    const fileName = decodeURIComponent(
      fileUrl.split("/").pop()?.split("?")[0] ?? "document"
    );
    const exists = files.some((f) => f.url === fileUrl);
    if (!exists) {
      files.push({
        id: `${projectId}-${files.length}`,
        name: fileName,
        url: fileUrl,
        type: match[1].toLowerCase(),
      });
    }
  }

  return files;
}
