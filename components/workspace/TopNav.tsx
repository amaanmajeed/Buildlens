"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { GEMINI_MODEL_OPTIONS, parseGeminiModelId } from "@/lib/geminiModels";
import { useAppState } from "@/components/workspace/AppStateProvider";

function NavLink({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`text-sm font-medium leading-snug pb-1 transition-colors ${
        active
          ? "border-b-2 border-primary font-semibold text-primary"
          : "border-b-2 border-transparent font-normal text-on-surface-variant hover:text-primary"
      }`}
    >
      {children}
    </Link>
  );
}

export function TopNav({
  insightsActive,
}: {
  /** Force Insights tab styling (e.g. spec/plan workspace) */
  insightsActive?: boolean;
}) {
  const pathname = usePathname() ?? "";
  const { geminiModel, setGeminiModel } = useAppState();
  const opportunitiesActive =
    pathname === "/" ||
    pathname === "/opportunities" ||
    pathname.startsWith("/opportunities/");
  const insights =
    insightsActive ??
    (!opportunitiesActive &&
      (pathname.startsWith("/spec-analysis") ||
        pathname.startsWith("/plan-takeoff") ||
        pathname.startsWith("/estimate-draft")));

  return (
    <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-background px-margin-mobile md:px-margin-desktop">
      <div className="flex items-center gap-stack-lg">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-primary md:text-xl"
        >
          BuildLens AI
        </Link>
        <nav className="ml-stack-lg hidden gap-stack-md md:flex md:gap-stack-lg">
          <NavLink href="/" active={opportunitiesActive}>
            Opportunities
          </NavLink>
          <NavLink href="/spec-analysis" active={insights ?? false}>
            Insights
          </NavLink>
        </nav>
      </div>
      <div className="flex min-w-0 max-w-[55vw] items-center gap-stack-sm md:max-w-none md:gap-stack-md">
        <label htmlFor="gemini-model" className="sr-only">
          Gemini model
        </label>
        <select
          id="gemini-model"
          value={geminiModel}
          onChange={(e) =>
            setGeminiModel(parseGeminiModelId(e.target.value))
          }
          className="min-w-0 max-w-[10.5rem] shrink truncate rounded-lg border border-outline-variant bg-background px-2 py-1.5 text-xs text-on-surface shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary sm:max-w-[14rem] md:text-sm"
          aria-label="Gemini model"
        >
          {GEMINI_MODEL_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          aria-label="Notifications"
          className="inline-flex size-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-variant"
        >
          <Icon name="notifications" size="lg" className="text-on-surface-variant" />
        </button>
        <button
          type="button"
          aria-label="Settings"
          className="inline-flex size-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-variant"
        >
          <Icon name="settings" size="lg" className="text-on-surface-variant" />
        </button>
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-primary-container text-xs font-semibold text-on-primary-container"
          title="Profile"
        >
          JD
        </div>
      </div>
    </header>
  );
}
