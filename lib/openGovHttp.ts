import https from "node:https";
import type { IncomingHttpHeaders } from "node:http";

export type OpenGovHttpResult = {
  status: number;
  headers: IncomingHttpHeaders;
  body: Buffer;
};

function header(headers: IncomingHttpHeaders, name: string): string | null {
  const v = headers[name.toLowerCase()];
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

/**
 * Outbound HTTPS to OpenGov / CDN / S3.
 * ponytail: Node undici `fetch` ETIMEDOUT + IPv6 ENETUNREACH to Cloudflare here;
 * `https` + family:4 works. Drop when undici happy-eyeballs is reliable.
 */
export function openGovHttp(
  url: string,
  opts: {
    method?: "GET" | "HEAD";
    headers?: Record<string, string>;
  } = {}
): Promise<OpenGovHttpResult> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port || 443,
        path: `${u.pathname}${u.search}`,
        method: opts.method ?? "GET",
        family: 4,
        headers: opts.headers,
        servername: u.hostname,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () =>
          resolve({
            status: res.statusCode ?? 0,
            headers: res.headers,
            body: Buffer.concat(chunks),
          })
        );
      }
    );
    req.setTimeout(45_000, () => {
      req.destroy(new Error("OpenGov request timed out"));
    });
    req.on("error", reject);
    req.end();
  });
}

/** Follow redirects (attachment API → signed S3). */
export async function openGovHttpFollow(
  url: string,
  opts: { headers?: Record<string, string> } = {},
  maxRedirects = 8
): Promise<OpenGovHttpResult> {
  let current = url;
  for (let i = 0; i <= maxRedirects; i++) {
    const res = await openGovHttp(current, {
      method: "GET",
      headers: opts.headers,
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = header(res.headers, "location");
      if (!loc) {
        throw new Error(`Redirect without Location (${res.status})`);
      }
      current = new URL(loc, current).href;
      continue;
    }
    return res;
  }
  throw new Error("Too many redirects");
}

export function openGovHeader(
  headers: IncomingHttpHeaders,
  name: string
): string | null {
  return header(headers, name);
}
