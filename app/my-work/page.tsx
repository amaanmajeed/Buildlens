import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { MyWorkContent } from "@/components/MyWorkContent";

export default function MyWorkPage() {
  return (
    <WorkspaceShell variant="feed">
      <MyWorkContent />
    </WorkspaceShell>
  );
}
