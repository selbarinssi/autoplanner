import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function PlanPage() {
  return (
    <>
      <PageHeader
        title="Plan Board"
        description="Auto-dispatch orders onto vans using neighborhood clusters and your configured criteria."
        actions={
          <>
            <Button variant="secondary" size="sm">Upload Orders</Button>
            <Button size="sm">Auto-Plan</Button>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-5">
        <Card className="col-span-3 min-h-[420px]">
          <p className="text-xs tracking-widest uppercase text-[var(--text-muted)] mb-3">
            Unassigned
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            Orders waiting for assignment will appear here.
          </p>
        </Card>

        <Card className="col-span-9 min-h-[420px]">
          <p className="text-xs tracking-widest uppercase text-[var(--text-muted)] mb-3">
            Vehicles
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            Van columns will appear here after fleet is configured and Auto-Plan runs.
          </p>
        </Card>
      </div>
    </>
  );
}
