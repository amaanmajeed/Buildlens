import { MSG } from "@/lib/messages";

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
  const res = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": OPENGOV_UA, Accept: "*/*" },
  });
  if (!res.ok) {
    throw new Error(`Download failed (${res.status}).`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > MAX_BYTES) {
    throw new Error(MSG.tooLarge);
  }
  const fromHeader = fileNameFromContentDisposition(
    res.headers.get("content-disposition")
  );
  const fromUrl = decodeURIComponent(
    url.split("/").pop()?.split("?")[0] ?? "document"
  );
  const fileName = fromHeader || fromUrl || "document";
  const contentType =
    res.headers.get("content-type") ?? "application/octet-stream";
  return {
    base64: buf.toString("base64"),
    fileName,
    contentType,
  };
}
