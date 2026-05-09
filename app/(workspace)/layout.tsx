"use client";

import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { WorkspaceStateProvider } from "@/components/workspace/WorkspaceStateProvider";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkspaceStateProvider>
      <WorkspaceShell variant="workspace">{children}</WorkspaceShell>
    </WorkspaceStateProvider>
  );
}
