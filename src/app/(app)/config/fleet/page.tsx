import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function FleetPage() {
  return (
    <>
      <PageHeader
        title="Fleet"
        description="Vans and their satellite vehicles. Only vans receive orders."
        actions={<Button size="sm">Add Van</Button>}
      />
      <Card>
        <p className="text-sm text-[var(--text-secondary)]">
          Fleet table + satellite “+” controls will live here.
        </p>
      </Card>
    </>
  );
}
