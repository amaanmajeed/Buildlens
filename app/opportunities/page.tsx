"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

const OPPORTUNITIES = [
  {
    id: "1",
    org: "FDOT District 5",
    title: "SR-400 Pavement Rehabilitation",
    due: "Due Oct 14",
    daysLeft: "14 Days Left",
    urgent: true,
    tags: ["Paving", "Maintenance"],
    value: "$2.5M - $5.0M",
    docs: "42",
    status: "analyzed",
  },
  {
    id: "2",
    org: "City of Orlando",
    title: "Main St. Stormwater Expansion",
    due: "Due Nov 02",
    daysLeft: "32 Days Left",
    urgent: false,
    tags: ["Drainage", "Utility"],
    value: "$8.2M",
    docs: "118",
    status: "processing",
  },
  {
    id: "3",
    org: "Seminole County",
    title: "Red Bug Lake Intersection",
    due: "Due Oct 18",
    daysLeft: "18 Days Left",
    urgent: true,
    tags: ["Signalization", "Civil"],
    value: "$1.2M - $2.0M",
    docs: "24",
    status: "analyzed",
  },
  {
    id: "4",
    org: "Florida Turnpike Ent.",
    title: "SunPass Gantry Upgrade Ph. 2",
    due: "Due Dec 05",
    daysLeft: "65 Days Left",
    urgent: false,
    tags: ["Technology", "Toll"],
    value: "$15.0M+",
    docs: "203",
    status: "analyzed",
  },
] as const;

export default function OpportunitiesPage() {
  const [, setKeyword] = useState("");
  return (
    <>
      <section className="border-b border-outline-variant bg-surface-container-lowest pb-stack-lg pt-stack-xl">
        <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
          <div className="flex flex-col gap-stack-md">
            <div>
              <h1 className="mb-2 text-3xl font-semibold tracking-tight text-primary md:text-[2rem] md:leading-tight">
                Discovery Feed
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-on-surface-variant md:text-base">
                Find and analyze heavy civil bid opportunities powered by
                BuildLens AI intelligence.
              </p>
            </div>
            <div className="shadow-buildlens mt-stack-md rounded-xl border border-outline-variant bg-background p-stack-md">
              <div className="grid grid-cols-1 items-end gap-gutter md:grid-cols-12">
                <div className="md:col-span-4">
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.06em] text-on-surface-variant">
                    Search keywords
                  </label>
                  <div className="relative">
                    <Icon
                      name="search"
                      size="md"
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline"
                    />
                    <input
                      className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-3 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="e.g. SR-400 Rehabilitation"
                      onChange={(e) => setKeyword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.06em] text-on-surface-variant">
                    Municipality
                  </label>
                  <select className="w-full appearance-none rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm">
                    <option>All Regions</option>
                    <option>FDOT District 5</option>
                    <option>City of Orlando</option>
                    <option>Orange County</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.06em] text-on-surface-variant">
                    Project type
                  </label>
                  <select className="w-full appearance-none rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm">
                    <option>All Types</option>
                    <option>Paving</option>
                    <option>Drainage</option>
                    <option>Signalization</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.06em] text-on-surface-variant">
                    Estimated value
                  </label>
                  <select className="w-full appearance-none rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm">
                    <option>Any Value</option>
                    <option>$1M - $5M</option>
                    <option>$5M - $20M</option>
                    <option>$20M+</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <button
                    type="button"
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary shadow-sm ring-1 ring-primary/15 hover:opacity-[0.92]"
                  >
                    <Icon name="filter_list" size="md" className="text-white" />
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-container-max px-margin-mobile py-stack-xl md:px-margin-desktop">
        <div className="mb-stack-lg flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight text-primary md:text-xl">
              Active opportunities
            </span>
            <span className="rounded-md bg-secondary-container px-2 py-1 text-[11px] font-semibold tabular-nums text-on-secondary-container">
              148 projects
            </span>
          </div>
          <div className="flex items-center gap-stack-sm">
            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-outline-variant bg-white px-4 text-[13px] font-medium text-on-surface-variant shadow-sm hover:bg-surface-container"
            >
              <Icon name="sort" size="md" />
              Sort: newest
            </button>
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-lg border border-outline-variant bg-white text-on-surface-variant shadow-sm hover:bg-surface-container"
              aria-label="Grid view"
            >
              <Icon name="grid_view" size="md" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
          {OPPORTUNITIES.map((o) => (
            <div
              key={o.id}
              className="group shadow-buildlens relative flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-white p-6 transition-shadow hover:shadow-lg"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
                    {o.org}
                  </span>
                  <h3 className="mt-1 text-xl font-semibold text-primary transition-colors group-hover:text-primary-container">
                    {o.title}
                  </h3>
                </div>
                <div className="flex shrink-0 flex-col items-end text-right">
                  <span
                    className={`text-[10px] font-bold uppercase ${o.urgent ? "text-error" : "text-on-surface-variant"}`}
                  >
                    {o.due}
                  </span>
                  <span className="text-[13px] text-on-surface-variant">
                    {o.daysLeft}
                  </span>
                </div>
              </div>
              <div className="mb-6 flex flex-wrap gap-2">
                {o.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-surface-container px-3 py-1 text-[10px] font-semibold text-on-surface-variant"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="mb-6 grid grid-cols-2 gap-4 border-y border-outline-variant py-4">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-on-surface-variant">
                    Est. value
                  </span>
                  <p className="font-mono text-xl font-semibold text-primary">
                    {o.value}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase text-on-surface-variant">
                    Docs
                  </span>
                  <p className="font-mono text-xl font-semibold text-primary">
                    {o.docs}
                  </p>
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${o.status === "processing" ? "animate-pulse bg-primary" : "bg-green-500"}`}
                  />
                  <span
                    className={`text-[10px] font-bold uppercase ${o.status === "processing" ? "text-primary" : "text-green-700"}`}
                  >
                    {o.status === "processing"
                      ? "Processing docs"
                      : "Package analyzed"}
                  </span>
                </div>
                <Link
                  href="/"
                  className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white shadow-sm ring-1 ring-white/15 transition-colors hover:bg-primary-container"
                >
                  Open project
                  <Icon name="arrow_forward" size="sm" className="text-white" />
                </Link>
              </div>
            </div>
          ))}

          <div className="shadow-buildlens flex flex-col rounded-xl border border-outline-variant bg-gradient-to-br from-primary-container to-primary p-6 text-on-primary md:col-span-2 lg:col-span-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-80">
                  Intelligence feature
                </span>
                <h3 className="mt-2 text-4xl font-semibold leading-tight">
                  Bid win probability analysis
                </h3>
              </div>
              <Icon name="insights" size="5xl" className="opacity-25 text-white" />
            </div>
            <p className="mt-4 max-w-md text-base opacity-90">
              BuildLens AI analyzes your company&apos;s past performance,
              regional competition, and project technical requirements to
              predict your chances of a successful bid.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-stack-md sm:grid-cols-3">
              {[
                { k: "Historical win rate", v: "24.5%" },
                { k: "Market density", v: "Medium" },
                { k: "AI match score", v: "88/100" },
              ].map((x) => (
                <div
                  key={x.k}
                  className="rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-sm"
                >
                  <span className="block text-[10px] font-semibold uppercase opacity-70">
                    {x.k}
                  </span>
                  <span className="font-mono text-2xl font-semibold">{x.v}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-8 self-start rounded-lg bg-white px-6 py-3 text-sm font-medium text-primary shadow-md transition-opacity hover:opacity-[0.95]"
            >
              Upgrade your analysis
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
