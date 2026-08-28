"use client";

import { createBrowserClient } from "@/lib/supabase/client";
import { useAppState } from "@/components/workspace/AppStateProvider";
import { AI_MODEL_OPTIONS, parseAiModelId } from "@/lib/aiModels";
import { Icon } from "@/components/ui/Icon";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function setFavicon(dark: boolean) {
  const href = dark
    ? "/buildlens-icon-dark.png"
    : "/buildlens-icon-light.png";
  let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.type = "image/png";
  link.href = href;
}

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

export function TopNav() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { aiModel, setAiModel } = useAppState();
  const [dark, setDark] = useState(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });
  const [email, setEmail] = useState<string | null>(null);

  const opportunitiesActive =
    pathname === "/" ||
    pathname === "/opportunities" ||
    pathname.startsWith("/opportunities/");
  const myWorkActive =
    pathname === "/my-work" || pathname.startsWith("/my-work/");
  const settingsActive =
    pathname === "/settings" || pathname.startsWith("/settings/");

  useEffect(() => {
    setFavicon(dark);
  }, [dark]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && typeof data.email === "string") setEmail(data.email);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleTheme() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setDark(next);
  }

  async function signOut() {
    try {
      const supabase = createBrowserClient();
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
    await fetch("/api/auth/session", { method: "DELETE" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-background px-margin-mobile md:px-margin-desktop">
      <div className="flex min-w-0 items-center gap-stack-lg">
        <Link href="/" className="flex shrink-0 items-center">
          <img
            src={
              dark
                ? "/buildlens-logo-dark.png"
                : "/buildlens-logo-light.png"
            }
            alt="BuildLens AI"
            className="h-9 w-auto md:h-10"
          />
        </Link>
        <nav className="ml-stack-lg hidden gap-stack-md md:flex md:gap-stack-lg">
          <NavLink href="/" active={opportunitiesActive}>
            Opportunities
          </NavLink>
          <NavLink href="/my-work" active={myWorkActive}>
            My Work
          </NavLink>
          <NavLink href="/settings" active={settingsActive}>
            Settings
          </NavLink>
        </nav>
      </div>
      <div className="flex min-w-0 max-w-[60vw] items-center gap-stack-sm md:max-w-none md:gap-stack-md">
        {email ? (
          <span
            className="hidden max-w-[10rem] truncate text-xs text-on-surface-variant lg:inline"
            title={email}
          >
            {email}
          </span>
        ) : null}
        <label htmlFor="ai-model" className="sr-only">
          AI model
        </label>
        <select
          id="ai-model"
          value={aiModel}
          onChange={(e) => setAiModel(parseAiModelId(e.target.value))}
          className="min-w-0 max-w-[10.5rem] shrink truncate rounded-lg border border-outline-variant bg-background px-2 py-1.5 text-xs text-on-surface shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary sm:max-w-[14rem] md:text-sm"
          aria-label="AI model"
        >
          {AI_MODEL_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          aria-label="Toggle theme"
          onClick={toggleTheme}
          className="inline-flex size-10 items-center justify-center rounded-lg bg-surface-container-high text-on-surface transition-colors hover:bg-surface-variant"
        >
          <Icon name={dark ? "sun" : "moon"} size="lg" className="text-on-surface" />
        </button>
        <button
          type="button"
          onClick={() => void signOut()}
          className="hidden h-9 items-center rounded-lg border border-outline-variant px-3 text-xs font-medium text-on-surface sm:inline-flex"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
