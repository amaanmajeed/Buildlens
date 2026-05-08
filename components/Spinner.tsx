"use client";

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-slate-600">
      <span
        className="size-5 animate-spin rounded-full border-2 border-[#1E3A5F] border-t-transparent"
        aria-hidden
      />
      {label ? <span>{label}</span> : null}
    </span>
  );
}
