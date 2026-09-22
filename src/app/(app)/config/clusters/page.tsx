import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function ClustersPage() {
  return (
    <>
      <PageHeader
        title="Clusters"
        description="Group low-volume neighborhoods into clusters. Drag neighborhoods between clusters."
        actions={<Button size="sm">New Cluster</Button>}
      />
      <Card>
        <p className="text-sm text-[var(--text-secondary)]">
          Drag-and-drop cluster builder will live here.
        </p>
      </Card>
    </>
  );
}
