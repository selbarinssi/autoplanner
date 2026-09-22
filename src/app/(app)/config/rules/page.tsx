import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';

export default function RulesPage() {
  return (
    <>
      <PageHeader
        title="Dispatch Rules"
        description="Reorder criteria by priority and adjust weights. Higher cards = higher priority."
      />
      <Card>
        <p className="text-sm text-[var(--text-secondary)]">
          Drag-and-drop priority cards will live here.
        </p>
      </Card>
    </>
  );
}
