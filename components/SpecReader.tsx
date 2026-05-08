"use client";

import { useCallback, useRef, useState } from "react";
import { fileToBase64 } from "@/lib/fileBase64";
import { MSG } from "@/lib/messages";
import type { ChatTurn, SovRow } from "@/lib/types";
import { Spinner } from "./Spinner";

const MAX_BYTES = 20 * 1024 * 1024;

export function SpecReader() {
  const inputRef = useRef<HTMLInputElement>(null);
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

  const onFile = useCallback(async (f: File | null) => {
    setBanner(null);
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
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
    setMessages([]);
    setPdfBase64(null);
    setFileLabel(f.name);
    try {
      const b64 = await fileToBase64(f);
      setPdfBase64(b64);
      const res = await fetch("/api/spec-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfBase64: b64 }),
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
        setSovLoading(false);
        return;
      }
      const rows = Array.isArray(data.schedule) ? data.schedule : [];
      setSchedule(rows);
      setSovReady(true);
    } catch {
      setBanner(MSG.aiUnavailable);
    } finally {
      setSovLoading(false);
    }
  }, []);

  const sendQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfBase64 || !sovReady || chatLoading) return;
    const q = question.trim();
    if (!q) return;
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
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-[#1E3A5F]">
        1. Spec Reader
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Upload a specification PDF, review the Schedule of Values, and ask
        questions about the document.
      </p>

      {banner ? (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-[#EF4444]">
          {banner}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
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
          className="rounded-md bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Upload spec PDF
        </button>
        {fileLabel ? (
          <span className="text-sm text-slate-700">{fileLabel}</span>
        ) : null}
        {sovLoading ? <Spinner label="Extracting Schedule of Values…" /> : null}
        {sovReady && !sovLoading ? (
          <span className="text-sm font-medium text-[#22C55E]">
            Document ready
          </span>
        ) : null}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Chat</h3>
          <div className="mt-2 flex max-h-80 flex-col gap-3 overflow-y-auto rounded-md border border-slate-200 bg-[#F4F7FA] p-3">
            {messages.length === 0 ? (
              <p className="text-sm text-slate-500">
                Ask about materials, sections, schedule, or payment terms.
              </p>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.role === "user"
                      ? "ml-8 rounded-md bg-white px-3 py-2 text-sm shadow-sm"
                      : "mr-8 rounded-md bg-white px-3 py-2 text-sm shadow-sm"
                  }
                >
                  <span className="text-xs font-medium uppercase text-slate-500">
                    {m.role === "user" ? "You" : "BuildLens"}
                  </span>
                  <p className="mt-1 whitespace-pre-wrap text-slate-800">
                    {m.content}
                  </p>
                </div>
              ))
            )}
          </div>
          <form onSubmit={sendQuestion} className="mt-3 flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 disabled:bg-slate-100"
              placeholder={
                sovReady ? "Ask a question about this spec…" : "Upload a PDF first"
              }
              value={question}
              disabled={!sovReady || chatLoading}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <button
              type="submit"
              disabled={!sovReady || chatLoading || !question.trim()}
              className="rounded-md bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {chatLoading ? "…" : "Send"}
            </button>
          </form>
          {chatLoading ? (
            <div className="mt-2">
              <Spinner label="Thinking…" />
            </div>
          ) : null}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Schedule of Values
          </h3>
          <div className="mt-2 overflow-x-auto rounded-md border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-3 py-2 font-medium">Item</th>
                  <th className="px-3 py-2 font-medium">Qty</th>
                  <th className="px-3 py-2 font-medium">Unit</th>
                </tr>
              </thead>
              <tbody>
                {schedule.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-6 text-center text-slate-500"
                    >
                      {sovReady
                        ? "No Schedule of Values found in this document."
                        : "Upload a spec to extract line items."}
                    </td>
                  </tr>
                ) : (
                  schedule.map((row, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-3 py-2 text-slate-800">{row.item}</td>
                      <td className="px-3 py-2 text-slate-800">
                        {row.quantity}
                      </td>
                      <td className="px-3 py-2 text-slate-800">{row.unit}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
