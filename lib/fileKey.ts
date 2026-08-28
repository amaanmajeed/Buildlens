/** Stable File Search / workspace key: `{projectId}::{normalizedFileName}`. */
export function makeFileKey(
  projectId: number | string,
  fileName: string
): string {
  return `${projectId}::${normalizeFileName(fileName)}`;
}

export function normalizeFileName(fileName: string): string {
  return fileName.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Manual uploads (no portal project). */
export function makeManualFileKey(
  fileName: string,
  contentHash?: string
): string {
  const base = normalizeFileName(fileName);
  return contentHash
    ? `manual::${base}::${contentHash.slice(0, 12)}`
    : `manual::${base}`;
}

/** Short hash of base64 for manual upload collision safety. */
export function shortContentHash(pdfBase64: string): string {
  let h = 0;
  const step = Math.max(1, Math.floor(pdfBase64.length / 200));
  for (let i = 0; i < pdfBase64.length; i += step) {
    h = (h * 31 + pdfBase64.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16);
}
