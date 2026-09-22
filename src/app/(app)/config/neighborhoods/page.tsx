import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function NeighborhoodsPage() {
  return (
    <>
      <PageHeader
        title="Neighborhoods"
        description="Master list of neighborhoods per city. These feed the clustering engine."
        actions={<Button size="sm">Add Neighborhood</Button>}
      />
      <Card>
        <p className="text-sm text-[var(--text-secondary)]">
          Neighborhood table will live here.
        </p>
      </Card>
    </>
  );
}
