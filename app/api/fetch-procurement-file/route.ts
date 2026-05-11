import {
  downloadProcurementFile,
  isAllowedProcurementFileUrl,
} from "@/lib/procurementFileFetch";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const url = body?.url as string | undefined;
    if (!url || typeof url !== "string") {
      return Response.json({ error: "url is required" }, { status: 400 });
    }
    if (!isAllowedProcurementFileUrl(url)) {
      return Response.json({ error: "Invalid file URL." }, { status: 400 });
    }
    const out = await downloadProcurementFile(url);
    return Response.json({
      base64: out.base64,
      fileName: out.fileName,
      contentType: out.contentType,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Could not download file.";
    return Response.json({ error: message }, { status: 502 });
  }
}
