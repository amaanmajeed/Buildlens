import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

const ACTIVITY = [
  {
    dot: "primary" as const,
    title: "BuildLens extracted 45 new drainage quantities.",
    time: "2m ago",
    desc: "Processed Sheet C-104 (Drainage Details) and updated the bid items registry.",
  },
  {
    dot: "error" as const,
    title: "Risk Alert: Contradictory compaction standards.",
    time: "15m ago",
    desc: "AI detected 95% Modified Proctor in Specs vs 98% in Plan Notes. Flagged for RFI.",
  },
  {
    dot: "on-tertiary-container" as const,
    title: "Document clustering complete.",
    time: "1h ago",
    desc: "94 documents sorted into Structural, Civil, and Mechanical categories.",
  },
  {
    dot: "surface-variant" as const,
    title: "New addendum processed.",
    time: "3h ago",
    desc: "Addendum #3 integrated. No significant change to pavement quantities detected.",
  },
];

export default function ProjectHubPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] px-margin-mobile py-stack-lg pb-24 md:px-margin-desktop md:pb-32">
      <header className="mb-stack-xl" id="buildlens-hub">
        <nav className="mb-3 flex flex-wrap items-center gap-2 text-[13px] font-medium text-on-surface-variant">
          <Link href="/" className="transition-colors hover:text-primary">
            Projects
          </Link>
          <Icon name="chevron_right" size="xs" className="text-outline" />
          <span className="font-semibold text-primary">
            SR-400 Pavement Rehabilitation
          </span>
        </nav>
        <div className="flex flex-col gap-stack-md md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-[1.625rem] font-semibold leading-tight tracking-tight text-primary sm:text-3xl sm:leading-snug md:text-[2rem]">
              Project Overview
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
              Status:{" "}
              <span className="font-medium text-secondary">
                Active specification review
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-white px-4 text-sm font-medium text-primary shadow-sm transition-colors hover:bg-surface-variant"
            >
              <Icon name="share" size="md" className="text-primary" />
              Export summary
            </button>
            <Link
              href="/spec-analysis"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary shadow-sm ring-1 ring-primary/15 transition-opacity hover:opacity-[0.92]"
            >
              <Icon name="play_arrow" size="md" className="text-on-primary" />
              Continue to Spec Analysis
            </Link>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-12 xl:grid-cols-12">
        <section className="shadow-buildlens col-span-12 rounded-xl border border-outline-variant bg-white p-6 md:p-8">
          <h2 className="mb-8 text-lg font-semibold tracking-tight text-primary md:text-xl">
            Workflow Progress
          </h2>
          <div className="-mx-1 overflow-x-auto pb-1 pt-2">
            <div className="relative min-w-[400px] px-6 md:min-w-0">
              <div
                aria-hidden
                className="absolute left-[10%] right-[10%] top-[26px] z-[1] h-0.5 rounded-full bg-surface-container-high"
              />
              <div className="relative z-[2] grid grid-cols-3 gap-2 md:gap-4">
                {[
                  {
                    icon: "analytics",
                    label: "Spec Analysis",
                    status: "Start here",
                    done: false,
                    active: true,
                  },
                  {
                    icon: "architecture",
                    label: "Plan Takeoff",
                    status: "Pending",
                    done: false,
                    active: false,
                  },
                  {
                    icon: "request_quote",
                    label: "Estimate Draft",
                    status: "Pending",
                    done: false,
                    active: false,
                  },
                ].map((step) => (
                  <div
                    key={step.label}
                    className={`flex flex-col items-center gap-2 px-1 text-center ${
                      !step.active && !step.done ? "opacity-45" : ""
                    }`}
                  >
                    <div
                      className={`relative flex size-[52px] shrink-0 items-center justify-center rounded-full border-[3px] border-white shadow-sm ${
                        step.done
                          ? "bg-primary text-on-primary ring-1 ring-primary/25"
                          : step.active
                            ? "bg-primary-container text-on-primary ring-[3px] ring-primary-container/40"
                            : "bg-surface-container-high text-on-surface-variant ring-1 ring-outline-variant"
                      }`}
                    >
                      <Icon
                        name={step.icon}
                        size="md"
                        className={step.done || step.active ? "text-current" : ""}
                      />
                    </div>
                    <p className="max-w-[7.5rem] text-[11px] font-semibold uppercase leading-snug tracking-[0.04em] text-primary">
                      {step.label}
                    </p>
                    <p className="text-[10px] font-medium uppercase leading-snug tracking-wide text-on-surface-variant">
                      {step.status}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="shadow-buildlens col-span-12 flex items-start gap-4 rounded-xl border border-outline-variant bg-white p-6 md:col-span-4 md:p-7">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary-fixed text-primary ring-1 ring-primary/10">
            <Icon name="analytics" size="xl" className="text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase leading-snug tracking-[0.06em] text-on-surface-variant">
              Guided workflow
            </p>
            <h3 className="mt-1 text-3xl font-semibold tabular-nums leading-none tracking-tight text-primary md:text-[2rem]">
              3 steps
            </h3>
            <p className="mt-2 text-[13px] leading-snug text-on-surface-variant">
              Spec → Plan → Estimate
            </p>
          </div>
        </div>

        <div className="shadow-buildlens col-span-12 flex items-start gap-4 rounded-xl border border-outline-variant bg-white p-6 md:col-span-4 md:p-7">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-error-container ring-1 ring-error/15">
            <Icon name="warning" size="xl" className="text-error" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase leading-snug tracking-[0.06em] text-on-surface-variant">
              Critical spec risks
            </p>
            <h3 className="mt-1 text-3xl font-semibold tabular-nums leading-none tracking-tight text-error md:text-[2rem]">
              12
            </h3>
            <p className="mt-2 text-[13px] leading-snug text-error">
              Requires user attention
            </p>
          </div>
        </div>

        <div className="shadow-buildlens col-span-12 flex items-start gap-4 rounded-xl border border-outline-variant bg-white p-6 md:col-span-4 md:p-7">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-container shadow-sm ring-1 ring-black/10">
            <Icon name="layers" size="xl" className="text-on-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase leading-snug tracking-[0.06em] text-on-surface-variant">
              Quantities extracted
            </p>
            <h3 className="mt-1 text-3xl font-semibold tabular-nums leading-none tracking-tight text-primary md:text-[2rem]">
              324
            </h3>
            <p className="mt-2 text-[13px] leading-snug text-on-surface-variant">
              Cross-referenced with plans
            </p>
          </div>
        </div>

        <section className="shadow-buildlens col-span-12 flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-white xl:col-span-8">
          <div className="flex items-center justify-between border-b border-outline-variant px-6 py-4">
            <h2 className="text-lg font-semibold tracking-tight text-primary md:text-xl">
              Recent Intelligence Activity
            </h2>
            <span className="rounded-md bg-surface-container px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
              Live stream
            </span>
          </div>
          <div className="divide-y divide-outline-variant">
            {ACTIVITY.map((row, i) => (
              <div
                key={i}
                className="flex gap-4 p-4 transition-colors hover:bg-surface-bright"
              >
                <div
                  className="mt-1 h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      row.dot === "primary"
                        ? "#022448"
                        : row.dot === "error"
                          ? "#ba1a1a"
                          : row.dot === "on-tertiary-container"
                            ? "#c69b5f"
                            : "#e3e2e6",
                  }}
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-snug text-primary">
                      {row.title}
                    </p>
                    <span className="font-mono text-xs text-on-surface-variant">
                      {row.time}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] text-on-surface-variant">
                    {row.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="w-full rounded-b-xl border-t border-outline-variant px-4 py-3.5 text-center text-[13px] font-medium text-primary transition-colors hover:bg-surface-container-low"
          >
            View full audit trail
          </button>
        </section>

        <section className="col-span-12 flex flex-col gap-gutter xl:col-span-4">
          <div className="shadow-buildlens ai-gradient-surface relative overflow-hidden rounded-xl border border-outline-variant p-6">
            <div className="pointer-events-none absolute right-3 top-0 p-3 opacity-[0.07]">
              <Icon name="psychology" size="6xl" className="text-primary" />
            </div>
            <div className="mb-4 flex items-center gap-2">
              <Icon name="auto_awesome" size="lg" className="text-primary" />
              <h2 className="text-lg font-semibold tracking-tight text-primary md:text-xl">
                AI recommendation
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-primary">
              Based on the <strong>12 identified risks</strong> in the
              technical specifications, your next priority should be the{" "}
              <span className="font-bold underline decoration-primary/30">
                Concrete Pavement Section 400
              </span>{" "}
              analysis.
            </p>
            <p className="mt-3 text-sm text-on-surface-variant">
              The AI suggests reviewing the aggregate graduation requirements
              which deviate from standard GDOT specs.
            </p>
            <Link
              href="/spec-analysis"
              className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary-container text-sm font-medium text-white transition-colors hover:bg-primary"
            >
              Launch section analysis
            </Link>
          </div>

          <div className="shadow-buildlens rounded-xl bg-primary p-6 text-white">
            <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary-fixed/90">
              Project map reference
            </h4>
            <div className="relative mb-4 h-32 overflow-hidden rounded-xl border border-white/25 shadow-inner ring-1 ring-white/25">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-container via-primary to-[#022448]" />
              <Icon
                name="map"
                size="5xl"
                className="absolute inset-0 m-auto opacity-55 text-white drop-shadow-lg"
              />
            </div>
            <div className="flex items-center gap-2 text-sm leading-snug">
              <Icon name="location_on" size="md" className="text-secondary-fixed" />
              <span>I-285 at SR-400, Atlanta GA</span>
            </div>
          </div>
        </section>
      </div>

      <Link
        href="/spec-analysis#buildlens-ai"
        className="shadow-buildlens fixed bottom-6 right-6 z-50 inline-flex h-12 items-center gap-2.5 rounded-full bg-primary px-5 text-sm font-medium text-on-primary shadow-lg ring-1 ring-primary/20 transition-transform hover:scale-[1.02] md:bottom-8 md:right-8"
      >
        <Icon name="chat_bubble" size="md" className="text-on-primary" />
        Ask BuildLens AI
      </Link>
    </main>
  );
}
