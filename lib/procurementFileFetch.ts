import { MSG } from "@/lib/messages";
import { openGovHeader, openGovHttpFollow } from "@/lib/openGovHttp";

const MAX_BYTES = 20 * 1024 * 1024;

const OPENGOV_UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36";

/** SSRF guard: only OpenGov attachment API + known S3 bucket + asset CDN. */
export function isAllowedProcurementFileUrl(urlString: string): boolean {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  const h = url.hostname.toLowerCase();
  if (h === "api.procurement.opengov.com") {
    return url.pathname.startsWith("/api/v1/attachments/");
  }
  if (h === "assets.procurement.opengov.com") return true;
  return /^government-project\.s3\.[a-z0-9-]+\.amazonaws\.com$/i.test(h);
}

function fileNameFromContentDisposition(cd: string | null): string | null {
  if (!cd) return null;
  const star = /filename\*=UTF-8''([^;\n]+)/i.exec(cd);
  if (star?.[1]) return decodeURIComponent(star[1].trim());
  const quoted = /filename="([^"]+)"/i.exec(cd);
  if (quoted?.[1]) return quoted[1];
  const plain = /filename=([^;\n]+)/i.exec(cd);
  if (plain?.[1]) return plain[1].trim().replace(/^["']|["']$/g, "");
  return null;
}

export async function downloadProcurementFile(url: string): Promise<{
  base64: string;
  fileName: string;
  contentType: string;
}> {
  if (!isAllowedProcurementFileUrl(url)) {
    throw new Error("URL not allowed.");
  }
  const res = await openGovHttpFollow(url, {
    headers: { "User-Agent": OPENGOV_UA, Accept: "*/*" },
  });
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Download failed (${res.status}).`);
  }
  if (res.body.byteLength > MAX_BYTES) {
    throw new Error(MSG.tooLarge);
  }
  const fromHeader = fileNameFromContentDisposition(
    openGovHeader(res.headers, "content-disposition")
  );
  const fromUrl = decodeURIComponent(
    url.split("/").pop()?.split("?")[0] ?? "document"
  );
  const fileName = fromHeader || fromUrl || "document";
  const contentType =
    openGovHeader(res.headers, "content-type") ?? "application/octet-stream";
  return {
    base64: res.body.toString("base64"),
    fileName,
    contentType,
  };
}
