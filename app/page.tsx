import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { OpportunitiesContent } from "@/components/OpportunitiesContent";

export default function HomePage() {
  return (
    <WorkspaceShell variant="feed">
      <OpportunitiesContent />
    </WorkspaceShell>
  );
}
