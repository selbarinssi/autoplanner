import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';

export default function OrdersPage() {
  return (
    <>
      <PageHeader
        title="Orders & Calls"
        description="Confirm customer time slots and statuses before planning."
      />
      <Card>
        <p className="text-sm text-[var(--text-secondary)]">
          Call board and status filters will live here.
        </p>
      </Card>
    </>
  );
}
