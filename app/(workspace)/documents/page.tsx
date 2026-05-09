import { Icon } from "@/components/ui/Icon";

const DOCUMENT_GROUPS = [
  {
    accent: "bg-blue-500",
    title: "Specifications",
    count: "12 documents",
    flagged: false as const,
  },
  {
    accent: "bg-green-500",
    title: "Plan sheets",
    count: "45 documents",
    flagged: false as const,
  },
  {
    accent: "bg-amber-500",
    title: "Addenda",
    count: "3 items flagged",
    flagged: true as const,
  },
  {
    accent: "bg-slate-400",
    title: "Reference docs",
    count: "8 documents",
    flagged: false as const,
    dim: true as const,
  },
];

const DETECTED_ENTITIES = [
  { label: "Material grade", value: "4000 PSI mix design" },
  { label: "Compliance", value: "ASTM C94 / C94M" },
  { label: "Requirement", value: "Vapor retarder installation" },
];

export default function DocumentsPage() {
  return (
    <main className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <section className="flex w-full max-w-80 flex-col border-r border-outline-variant bg-surface">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight text-primary">
              Intelligence
            </h3>
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-lg text-outline transition-colors hover:bg-surface-variant hover:text-primary"
              aria-label="Filter"
            >
              <Icon name="filter_list" size="md" />
            </button>
          </div>
          <div className="mb-6 rounded-lg border border-primary/10 bg-primary-container/5 p-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary/80">
              Status
            </p>
            <p className="text-sm font-medium text-primary">
              BuildLens organized your bid package
            </p>
          </div>
          <div className="space-y-stack-md">
            {DOCUMENT_GROUPS.map((g) => (
              <button
                key={g.title}
                type="button"
                className={`group w-full text-left ${
                  g.dim ? "opacity-70" : ""
                }`}
              >
                <div
                  className={`flex items-center justify-between rounded-lg border border-outline-variant bg-white p-3 shadow-sm transition-all hover:border-primary-fixed-dim ${g.flagged ? "border-blue-100 bg-blue-50/30 ring-1 ring-blue-500/10" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-2 shrink-0 rounded-full ${g.accent}`} />
                    <div>
                      <p className="text-sm font-semibold text-on-surface">
                        {g.title}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {g.count}
                      </p>
                    </div>
                  </div>
                  <Icon
                    name={g.flagged ? "report_problem" : "chevron_right"}
                    size="md"
                    className={
                      g.flagged
                        ? "text-amber-600"
                        : "text-outline group-hover:text-primary"
                    }
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="border-t border-outline-variant p-4">
          <div className="flex items-center gap-3 rounded-lg border border-outline-variant bg-white p-3">
            <Icon name="search" size="md" className="shrink-0 text-primary" />
            <input
              className="w-full border-none bg-transparent text-sm placeholder:text-outline focus:ring-0"
              placeholder="Cmd+K to search specs…"
              readOnly
            />
          </div>
        </div>
      </section>

      <section className="relative flex min-w-0 flex-1 flex-col bg-surface-container-low">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-outline-variant bg-white px-6">
          <div className="flex min-w-0 items-center gap-4">
            <Icon name="description" size="md" className="shrink-0 text-blue-500" />
            <h1 className="truncate text-sm font-semibold leading-snug text-primary sm:text-base">
              Section 03 30 00 - Cast-in-Place Concrete.pdf
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-variant"
              aria-label="Zoom out"
            >
              <Icon name="zoom_out" size="md" />
            </button>
            <span className="rounded-md bg-surface-container px-2 py-1 font-mono text-xs tabular-nums">
              100%
            </span>
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-variant"
              aria-label="Zoom in"
            >
              <Icon name="zoom_in" size="md" />
            </button>
            <div className="mx-2 hidden h-4 w-px bg-outline-variant md:block" />
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-variant"
              aria-label="Download"
            >
              <Icon name="download" size="md" />
            </button>
          </div>
        </div>
        <div className="flex flex-1 items-start justify-center overflow-y-auto bg-surface-variant/30 p-8">
          <div className="shadow-buildlens relative min-h-[600px] w-full max-w-4xl border border-outline-variant bg-white p-12">
            <div className="aspect-[8.5/11] rounded border border-dashed border-outline-variant bg-gradient-to-br from-white to-surface-container-low">
              <p className="p-12 text-sm leading-relaxed text-on-surface-variant">
                Document preview placeholder. Upload and intelligence flows
                connect in a future release.
              </p>
            </div>
            <div className="absolute right-8 top-16 flex flex-col gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-blue-900">
                <Icon name="auto_awesome" size="xs" className="text-blue-700" />
                BuildLens verified
              </div>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
          <div className="pointer-events-auto shadow-buildlens flex items-center gap-6 rounded-full border border-primary/20 bg-white/90 px-6 py-4 backdrop-blur-xl">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-tighter text-outline">
                AI classification
              </span>
              <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Technical specifications
              </span>
            </div>
            <div className="hidden h-8 w-px bg-outline-variant sm:block" />
            <div className="hidden items-center gap-3 sm:flex">
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-on-primary shadow-sm hover:opacity-[0.92]"
              >
                <Icon name="check_circle" size="md" className="text-white" />
                Approve
              </button>
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-outline-variant bg-white px-5 text-sm font-medium text-on-surface-variant hover:bg-surface-variant"
              >
                Reclassify
                <Icon name="expand_more" size="md" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <aside className="hidden w-72 shrink-0 flex-col border-l border-outline-variant bg-white lg:flex">
        <div className="border-b border-outline-variant p-6">
          <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-outline">
            Document metadata
          </h4>
          <div className="space-y-4">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase text-on-surface-variant">
                Filename
              </p>
              <p className="break-all font-mono text-sm text-primary">
                CIP_Concrete_Section_033000_V2.pdf
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase text-on-surface-variant">
                  Date added
                </p>
                <p className="text-sm font-medium text-on-surface">
                  Oct 24, 2023
                </p>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase text-on-surface-variant">
                  File size
                </p>
                <p className="text-sm font-medium text-on-surface">4.2 MB</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto p-6">
          <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-outline">
            Detected entities
          </h4>
          <div className="space-y-3">
            {DETECTED_ENTITIES.map((e) => (
              <div key={e.label} className="rounded-lg bg-surface-container p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-primary/60">
                    {e.label}
                  </span>
                  <Icon name="info" size="xs" className="text-primary" />
                </div>
                <p className="text-sm font-semibold text-primary">{e.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-xl border border-amber-200/80 bg-tertiary-fixed p-4 text-on-tertiary-fixed">
            <div className="mb-2 flex items-center gap-2">
              <Icon name="lightbulb" size="lg" />
              <p className="text-xs font-bold uppercase tracking-tight">
                AI observation
              </p>
            </div>
            <p className="text-xs leading-relaxed">
              This document mentions Section 03 20 00 (reinforcing steel)
              which may be missing from the current bid folder.
            </p>
            <button
              type="button"
              className="mt-3 text-[11px] font-bold underline hover:no-underline"
            >
              Search project files
            </button>
          </div>
        </div>
      </aside>
    </main>
  );
}
