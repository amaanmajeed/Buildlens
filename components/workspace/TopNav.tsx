"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

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
  const opportunitiesActive =
    pathname === "/opportunities" ||
    pathname.startsWith("/opportunities/");
  const insights =
    insightsActive ??
    ((!opportunitiesActive && pathname !== "/opportunities") &&
      (pathname === "/" ||
        pathname.startsWith("/spec-analysis") ||
        pathname.startsWith("/plan-takeoff") ||
        pathname.startsWith("/estimate-draft") ||
        pathname.startsWith("/documents")));

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
          <NavLink href="/opportunities" active={opportunitiesActive}>
            Opportunities
          </NavLink>
          <NavLink href="/spec-analysis" active={insights ?? false}>
            Insights
          </NavLink>
        </nav>
      </div>
      <div className="flex items-center gap-stack-md">
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
