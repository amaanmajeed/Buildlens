"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

const items = [
  { href: "/spec-analysis", icon: "analytics", label: "Spec Analysis" },
  { href: "/plan-takeoff", icon: "architecture", label: "Plan Takeoff" },
  { href: "/estimate-draft", icon: "request_quote", label: "Estimate Draft" },
] as const;

export function SideNav() {
  const pathname = usePathname() ?? "";

  return (
    <aside className="fixed left-0 top-16 z-40 hidden h-[calc(100vh-4rem)] w-64 flex-col gap-stack-md overflow-y-auto border-r border-outline-variant bg-surface-container-low p-4 md:flex">
      <div className="flex items-start gap-3 px-2 py-2">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary shadow-sm ring-1 ring-primary/15">
          <Icon name="architecture" size="lg" className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold leading-tight tracking-tight text-primary">
            Project Alpha
          </h2>
          <p className="mt-1 text-[10px] font-semibold uppercase leading-snug tracking-[0.08em] text-on-surface-variant">
            Terminal Expansion
          </p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 pt-2">
        {items.map(({ href, icon, label }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${
                active
                  ? "bg-secondary-container text-on-secondary-container shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container-lowest/70"
              }`}
            >
              <Icon
                name={icon}
                size="md"
                className={
                  active ? "text-on-secondary-container" : "text-on-surface-variant"
                }
              />
              <span className="leading-snug">{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
