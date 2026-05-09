"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { SideNav } from "./SideNav";
import { TopNav } from "./TopNav";

type Props = {
  children: React.ReactNode;
  variant?: "workspace" | "feed";
};

export function WorkspaceShell({ children, variant = "workspace" }: Props) {
  const router = useRouter();

  const runBuildLens = useCallback(() => {
    router.push("/spec-analysis#buildlens-ai");
    requestAnimationFrame(() => {
      const el = document.getElementById("buildlens-ai");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [router]);

  if (variant === "feed") {
    return (
      <div className="min-h-screen">
        <TopNav />
        <div className="pt-16">{children}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TopNav />
      <SideNav onRunAi={runBuildLens} />
      <div className="ml-0 pt-16 md:ml-64">{children}</div>
    </div>
  );
}
