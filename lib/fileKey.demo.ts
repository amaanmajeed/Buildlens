import {
  makeFileKey,
  makeManualFileKey,
  normalizeFileName,
  shortContentHash,
} from "./fileKey";

// ponytail: assert-based self-check for file_key stability
function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

export function demoFileKey() {
  assert(
    normalizeFileName("  Spec  PDF.PDF ") === "spec pdf.pdf",
    "normalizeFileName collapses space/case"
  );
  assert(
    makeFileKey(42, "Recovered Materials.pdf") ===
      "42::recovered materials.pdf",
    "makeFileKey uses projectId::name"
  );
  assert(
    makeManualFileKey("a.pdf", "abcdef1234567890").endsWith("::abcdef123456"),
    "manual key includes short hash"
  );
  assert(shortContentHash("AAAA").length > 0, "hash non-empty");
  console.log("fileKey demo: ok");
}

if (typeof require !== "undefined" && require.main === module) {
  demoFileKey();
}
