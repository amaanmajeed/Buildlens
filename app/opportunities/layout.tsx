import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";

export default function OpportunitiesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <WorkspaceShell variant="feed">{children}</WorkspaceShell>;
}
