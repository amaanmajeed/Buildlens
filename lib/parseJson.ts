/** Strip markdown code fences so JSON.parse succeeds on Gemini output */
export function stripJsonFences(raw: string): string {
  let s = raw.trim();
  const fence = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/im;
  const m = s.match(fence);
  if (m) s = m[1].trim();
  else if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  const arrStart = s.indexOf("[");
  const arrEnd = s.lastIndexOf("]");
  if (arrStart !== -1 && arrEnd > arrStart) {
    s = s.slice(arrStart, arrEnd + 1);
  }
  return s.trim();
}

export function parseJsonArray<T>(raw: string): T[] {
  const cleaned = stripJsonFences(raw);
  const parsed = JSON.parse(cleaned) as unknown;
  if (!Array.isArray(parsed)) throw new Error("not_array");
  return parsed as T[];
}
