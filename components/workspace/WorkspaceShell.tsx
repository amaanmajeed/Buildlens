"use client";

import { SideNav } from "./SideNav";
import { TopNav } from "./TopNav";

type Props = {
  children: React.ReactNode;
  variant?: "workspace" | "feed";
};

export function WorkspaceShell({ children, variant = "workspace" }: Props) {
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
      <SideNav />
      <div className="ml-0 pt-16 md:ml-64">{children}</div>
    </div>
  );
}
