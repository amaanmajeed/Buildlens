import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { SettingsContent } from "@/components/SettingsContent";

export default function SettingsPage() {
  return (
    <WorkspaceShell variant="feed">
      <SettingsContent />
    </WorkspaceShell>
  );
}
