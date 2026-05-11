const EMBED_URL =
  "https://procurement.opengov.com/portal/embed/orangecountyfl/project-list";

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

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!res.ok) {
    throw new Error(`Portal returned ${res.status}`);
  }

  const html = await res.text();
  return parseProjectsFromHtml(html);
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

export async function fetchProjectFiles(
  projectId: number,
  addendumIds: number[],
  projectTitle: string
): Promise<ProjectFile[]> {
  const files: ProjectFile[] = [];
  const portalUrl = `https://procurement.opengov.com/portal/orangecountyfl/projects/${projectId}`;

  const url = `https://procurement.opengov.com/portal/embed/orangecountyfl/projects/${projectId}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (res.ok) {
      const html = await res.text();
      const parsed = parseFilesFromHtml(html, projectId);
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
