"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { fileToBase64 } from "@/lib/fileBase64";
import { MSG } from "@/lib/messages";
import type { ProjectFile } from "@/lib/scraper";
import type { ChatTurn, SovRow } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { useAppState } from "@/components/workspace/AppStateProvider";
import { Spinner } from "./Spinner";
import { ProjectScraper } from "./ProjectScraper";

const MAX_BYTES = 20 * 1024 * 1024;

const SUGGESTIONS = [
  "Summarize payment terms",
  "List approved materials",
  "Find liquidated damages",
];

export function SpecReader() {
  const { setSovSchedule, setSpecSourceFileId, setPortalPdfCache, geminiModel } =
    useAppState();
  const inputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [fileLabel, setFileLabel] = useState<string>("");
  const [sovLoading, setSovLoading] = useState(false);
  const [sovReady, setSovReady] = useState(false);
  const [schedule, setSchedule] = useState<SovRow[]>([]);
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [question, setQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const pickFile = () => inputRef.current?.click();

  const onScrapedFileReady = useCallback(
    async (b64: string, fileName: string, sourceFile?: ProjectFile | null) => {
      setBanner(null);
      setSpecSourceFileId(sourceFile?.id ?? null);
      setSovLoading(true);
      setSovReady(false);
      setSchedule([]);
      setSovSchedule([]);
      setMessages([]);
      setPdfBase64(null);
      setFileLabel(fileName);
      setPdfBase64(b64);
      try {
        const res = await fetch("/api/spec-extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pdfBase64: b64, model: geminiModel }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg =
            typeof data.error === "string" ? data.error : MSG.aiUnavailable;
          setBanner(msg);
          setSpecSourceFileId(null);
          return;
        }
        const rows = Array.isArray(data.schedule) ? data.schedule : [];
        setSchedule(rows);
        setSovSchedule(rows);
        setSovReady(true);
      } catch {
        setBanner(MSG.aiUnavailable);
        setSpecSourceFileId(null);
        setSovSchedule([]);
      } finally {
        setSovLoading(false);
      }
    },
    [setSovSchedule, setSpecSourceFileId, geminiModel]
  );

  const runExtract = useCallback(async (b64: string) => {
    const res = await fetch("/api/spec-extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pdfBase64: b64, model: geminiModel }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (process.env.NODE_ENV === "development" && data.debug) {
        console.error("[spec-extract]", data.code, data.debug);
      }
      const msg =
        typeof data.error === "string" ? data.error : MSG.aiUnavailable;
      const code =
        typeof data.code === "string" ? ` (${data.code})` : "";
      setBanner(msg + (process.env.NODE_ENV === "development" ? code : ""));
      setSovSchedule([]);
      return false;
    }
    const rows = Array.isArray(data.schedule) ? data.schedule : [];
    setSchedule(rows);
    setSovSchedule(rows);
    setSovReady(true);
    return true;
  }, [setSovSchedule, geminiModel]);

  const onFile = useCallback(
    async (f: File | null) => {
      setBanner(null);
      setSpecSourceFileId(null);
      setPortalPdfCache(null);
      if (!f) return;
      if (
        f.type !== "application/pdf" &&
        !f.name.toLowerCase().endsWith(".pdf")
      ) {
        setBanner(MSG.pdfOnly);
        return;
      }
      if (f.size > MAX_BYTES) {
        setBanner(MSG.tooLarge);
        return;
      }
      setSovLoading(true);
      setSovReady(false);
      setSchedule([]);
      setSovSchedule([]);
      setMessages([]);
      setPdfBase64(null);
      setFileLabel(f.name);
      try {
        const b64 = await fileToBase64(f);
        setPdfBase64(b64);
        await runExtract(b64);
      } catch {
        setBanner(MSG.aiUnavailable);
      } finally {
        setSovLoading(false);
      }
    },
    [runExtract, setSpecSourceFileId, setSovSchedule, setPortalPdfCache]
  );

  const recalculate = async () => {
    if (!pdfBase64) return;
    setSovLoading(true);
    setBanner(null);
    try {
      await runExtract(pdfBase64);
    } finally {
      setSovLoading(false);
    }
  };

  const exportReport = () => {
    if (schedule.length === 0) return;
    const header = ["Item", "Quantity", "Unit"];
    const lines = [
      header.join(","),
      ...schedule.map((row) =>
        [row.item, row.quantity, row.unit]
          .map((c) => {
            const t = String(c);
            if (/[",\n]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
            return t;
          })
          .join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "buildlens-spec-sov.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, chatLoading]);

  const sendQuestion = async (e?: React.FormEvent, qOverride?: string) => {
    e?.preventDefault();
    const q = (qOverride ?? question).trim();
    if (!pdfBase64 || chatLoading || !q) return;
    setChatLoading(true);
    setBanner(null);
    try {
      const res = await fetch("/api/spec-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfBase64,
          question: q,
          history: messages,
          model: geminiModel,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (process.env.NODE_ENV === "development" && data.debug) {
          console.error("[spec-chat]", data.code, data.debug);
        }
        const msg =
          typeof data.error === "string" ? data.error : MSG.aiUnavailable;
        const code =
          typeof data.code === "string" ? ` (${data.code})` : "";
        setBanner(msg + (process.env.NODE_ENV === "development" ? code : ""));
        return;
      }
      const answer =
        typeof data.answer === "string" ? data.answer : MSG.aiUnavailable;
      setMessages((m) => [
        ...m,
        { role: "user", content: q },
        { role: "assistant", content: answer },
      ]);
      setQuestion("");
    } catch {
      setBanner(MSG.aiUnavailable);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div
      id="buildlens-ai"
      className="flex min-h-[calc(100vh-4rem)] flex-col max-md:overflow-visible md:h-[calc(100vh-4rem)] md:max-h-[calc(100vh-4rem)] md:flex-row md:overflow-hidden"
    >
      <section className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-surface-bright p-margin-mobile pb-stack-xl md:h-full md:min-h-0 md:flex-[0.6] md:p-margin-desktop md:pb-stack-xl">
        <header className="mb-stack-lg shrink-0">
          <h1 className="text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
            Spec Analysis
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-on-surface-variant">
            Automated technical extraction for Section 03300: Cast-in-Place
            Concrete
          </p>
        </header>

        {banner ? (
          <p className="mb-4 shrink-0 rounded-lg border border-error/30 bg-error-container/40 px-3 py-2 text-sm text-error">
            {banner}
          </p>
        ) : null}

        <div className="mb-gutter shrink-0">
          <ProjectScraper onFileReady={onScrapedFileReady} lockProject />
        </div>

        <div className="grid grid-cols-1 gap-gutter">
          <div className="shadow-buildlens w-full rounded-lg border border-outline-variant bg-white p-6">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={pickFile}
                className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-on-primary shadow-sm ring-1 ring-primary/15 hover:opacity-[0.92]"
              >
                Upload spec PDF
              </button>
              {fileLabel ? (
                <span className="text-sm text-on-surface">{fileLabel}</span>
              ) : null}
              {sovLoading ? (
                <Spinner label="Extracting Schedule of Values…" />
              ) : null}
              {sovReady && !sovLoading ? (
                <span className="text-sm font-medium text-green-700">
                  Document ready
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2.5 border-b border-outline-variant pb-4">
              <Icon name="table_chart" size="md" className="text-primary" />
              <h3 className="text-lg font-semibold tracking-tight text-primary">
                Schedule of Values
              </h3>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-outline-variant">
                    <th className="p-3 text-[11px] font-semibold uppercase tracking-wider text-primary">
                      Item
                    </th>
                    <th className="p-3 text-[11px] font-semibold uppercase tracking-wider text-primary">
                      Qty
                    </th>
                    <th className="p-3 text-[11px] font-semibold uppercase tracking-wider text-primary">
                      Unit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {schedule.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="p-6 text-center text-on-surface-variant"
                      >
                        {sovReady
                          ? "No Schedule of Values found in this document."
                          : "Upload a spec to extract line items."}
                      </td>
                    </tr>
                  ) : (
                    schedule.map((row, i) => (
                      <tr
                        key={i}
                        className={
                          i % 2 === 0 ? "bg-primary/[0.02]" : undefined
                        }
                      >
                        <td className="p-3 text-on-surface">{row.item}</td>
                        <td className="p-3 font-mono text-on-surface">
                          {row.quantity}
                        </td>
                        <td className="p-3 text-on-surface">{row.unit}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="shadow-buildlens w-full rounded-lg border border-outline-variant bg-white p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <Icon name="info" size="md" className="text-primary" />
              <h3 className="text-lg font-semibold tracking-tight text-primary">
                Extraction notes
              </h3>
            </div>
            <p className="text-sm text-on-surface-variant">
              AI reads your PDF and surfaces the Schedule of Values for review.
              Use Project Intelligence to ask questions about risk, materials,
              and contract terms.
            </p>
          </div>
        </div>

        <div className="relative z-0 mt-stack-lg flex shrink-0 flex-wrap gap-2 border-t border-outline-variant bg-surface-bright pt-stack-lg pb-1">
          <button
            type="button"
            onClick={exportReport}
            disabled={schedule.length === 0}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-outline-variant bg-white px-4 text-sm font-medium text-on-surface shadow-sm transition-colors hover:bg-surface-variant disabled:opacity-50"
          >
            <Icon name="download" size="md" className="text-on-surface-variant" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => void recalculate()}
            disabled={!pdfBase64 || sovLoading}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary shadow-sm ring-1 ring-primary/15 transition-opacity hover:opacity-[0.92] disabled:opacity-50"
          >
            <Icon name="refresh" size="md" className="text-on-primary" />
            Recalculate
          </button>
          <Link
            href="/plan-takeoff"
            aria-disabled={!sovReady}
            className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium shadow-sm ring-1 ring-primary/15 transition-opacity ${
              sovReady
                ? "bg-primary text-on-primary hover:opacity-[0.92]"
                : "pointer-events-none bg-outline-variant text-on-surface-variant opacity-50"
            }`}
          >
            Next: Plan Takeoff
            <Icon name="arrow_forward" size="md" />
          </Link>
        </div>
      </section>

      <aside className="ai-gradient-surface flex min-h-[50vh] flex-col border-t border-outline-variant md:h-full md:min-h-0 md:max-w-[44%] md:flex-[0.4] md:border-l md:border-t-0">
        <div className="shrink-0 border-b border-outline-variant bg-white/50 p-stack-lg backdrop-blur-sm">
          <div className="mb-stack-md flex items-center gap-2.5">
            <Icon name="auto_awesome" size="md" className="text-primary" />
            <h2 className="text-lg font-semibold tracking-tight text-primary">
              Project Intelligence
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                disabled={!pdfBase64 || chatLoading}
                onClick={() => void sendQuestion(undefined, s)}
                className="rounded-full border border-outline-variant/30 bg-surface-container-high px-3.5 py-2 text-left text-xs font-medium leading-snug text-on-surface transition-colors hover:bg-surface-variant disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div
          ref={chatScrollRef}
          className="min-h-0 flex-1 space-y-stack-lg overflow-y-auto p-stack-lg"
        >
          {messages.length === 0 ? (
            <p className="text-sm text-on-surface-variant">
              Ask about materials, sections, schedule, or payment terms.
            </p>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ml-4 rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm shadow-sm"
                    : "mr-4 rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm shadow-sm"
                }
              >
                <span className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
                  {m.role === "user" ? "You" : "BuildLens"}
                </span>
                <p className="mt-1 whitespace-pre-wrap text-on-surface">
                  {m.content}
                </p>
              </div>
            ))
          )}
          {chatLoading ? (
            <div>
              <Spinner label="Thinking…" />
            </div>
          ) : null}
        </div>

        <div className="sticky bottom-0 z-20 shrink-0 border-t border-outline-variant bg-white p-stack-lg shadow-[0_-6px_20px_rgba(30,58,95,0.08)] md:static md:z-auto md:shadow-none">
          <form
            onSubmit={(e) => void sendQuestion(e)}
            className="relative flex items-center"
          >
            <input
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 pl-4 pr-12 text-sm text-on-surface transition-all placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ask about technical specs, risk, or dates…"
              value={question}
              disabled={!pdfBase64 || chatLoading}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <button
              type="submit"
              disabled={!pdfBase64 || chatLoading || !question.trim()}
              className="absolute right-2 inline-flex size-9 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/5 disabled:opacity-50"
              aria-label="Send"
            >
              <Icon name="send" size="md" />
            </button>
          </form>
          <div className="mt-2 flex items-center justify-between px-1 text-[11px] font-medium text-on-surface-variant">
            <span>BuildLens AI · Operational intel</span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Live analysis
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}
