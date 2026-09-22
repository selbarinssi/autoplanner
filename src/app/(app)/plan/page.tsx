'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Order, Vehicle } from '@/domain/types';
import { autoAssign } from '@/domain/assignment/autoAssign';
import type { VehicleState } from '@/domain/assignment/createVehicleState';
import { getOrders, replaceOrders } from '@/lib/repositories/orders';
import { getVehicles } from '@/lib/repositories/vehicles';
import { getNeighborhoods } from '@/lib/repositories/neighborhoods';
import { getClusters } from '@/lib/repositories/clusters';
import { getDispatchConfig } from '@/lib/repositories/dispatchConfig';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

/** Default TRS service names until Rules config exposes them */
const DEFAULT_TRS_SERVICES = [
  'TRS',
  'Click & Collect',
  'C&C',
  'Click and Collect',
];

export default function PlanPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleStates, setVehicleStates] = useState<
    Record<string, VehicleState>
  >({});
  const [unassignedNeighborhoodIds, setUnassignedNeighborhoodIds] = useState<
    string[]
  >([]);
  const [message, setMessage] = useState<string | null>(null);
  const [ran, setRan] = useState(false);

  function reloadMaster() {
    setOrders(getOrders());
    setVehicles(getVehicles());
  }

  useEffect(() => {
    reloadMaster();
  }, []);

  const activeVehicles = useMemo(
    () => vehicles.filter((v) => !v.isDown),
    [vehicles]
  );

  const confirmedOrders = useMemo(
    () => orders.filter((o) => o.status === 'confirmed'),
    [orders]
  );

  const unassignedOrders = useMemo(
    () => confirmedOrders.filter((o) => !o.assignedTo),
    [confirmedOrders]
  );

  function ordersForVehicle(vehicleId: string): Order[] {
    return confirmedOrders.filter((o) => o.assignedTo === vehicleId);
  }

  function runAutoPlan() {
    setMessage(null);

    const neighborhoods = getNeighborhoods();
    const clusters = getClusters();
    const config = getDispatchConfig();
    const fleet = getVehicles();
    const currentOrders = getOrders();

    const confirmed = currentOrders.filter((o) => o.status === 'confirmed');

    if (confirmed.length === 0) {
      setMessage('No confirmed orders. Import orders and set status to Confirmed first.');
      return;
    }
    if (fleet.filter((v) => !v.isDown).length === 0) {
      setMessage('No active vehicles. Add vans in Fleet and make sure they are not marked DOWN.');
      return;
    }
    if (neighborhoods.length === 0) {
      setMessage('No neighborhoods configured. Add them under Config → Neighborhoods.');
      return;
    }

    // Reset assignment on confirmed orders before running
    const reset = currentOrders.map((o) =>
      o.status === 'confirmed' ? { ...o, assignedTo: null } : o
    );

    const result = autoAssign(
      reset.filter((o) => o.status === 'confirmed'),
      fleet,
      neighborhoods,
      clusters,
      config,
      DEFAULT_TRS_SERVICES
    );

    // Merge assigned confirmed orders back into full list
    const byId = new Map(result.orders.map((o) => [o.id, o]));
    const merged = reset.map((o) => {
      const updated = byId.get(o.id);
      return updated ? updated : o;
    });

    replaceOrders(merged);
    setOrders(merged);
    setVehicleStates(result.vehicleStates);
    setUnassignedNeighborhoodIds(result.unassignedNeighborhoodIds);
    setRan(true);

    const assignedCount = result.orders.filter((o) => o.assignedTo).length;
    const unassignedCount = result.orders.length - assignedCount;
    setMessage(
      `Auto-Plan done: ${assignedCount} assigned, ${unassignedCount} unassigned` +
        (result.unassignedNeighborhoodIds.length
          ? ` · ${result.unassignedNeighborhoodIds.length} neighborhood(s) could not be placed`
          : '')
    );
  }

  function clearAssignments() {
    if (!confirm('Clear all vehicle assignments on confirmed orders?')) return;
    const next = getOrders().map((o) =>
      o.status === 'confirmed' ? { ...o, assignedTo: null } : o
    );
    replaceOrders(next);
    setOrders(next);
    setVehicleStates({});
    setUnassignedNeighborhoodIds([]);
    setRan(false);
    setMessage('Assignments cleared.');
  }

  return (
    <>
      <PageHeader
        title="Plan Board"
        description="Auto-dispatch confirmed orders onto vans using clusters and your dispatch rules."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={reloadMaster}>
              Refresh data
            </Button>
            <Button variant="secondary" size="sm" onClick={clearAssignments}>
              Clear plan
            </Button>
            <Button size="sm" onClick={runAutoPlan}>
              Auto-Plan
            </Button>
          </>
        }
      />

      {message && (
        <Card className="mb-5">
          <p className="text-sm">{message}</p>
        </Card>
      )}

      {/* Summary strip */}
      <div className="flex flex-wrap gap-3 mb-5 text-xs text-[var(--text-muted)]">
        <span>
          Confirmed orders:{' '}
          <strong className="text-[var(--text)]">{confirmedOrders.length}</strong>
        </span>
        <span>
          Unassigned:{' '}
          <strong className="text-[var(--text)]">{unassignedOrders.length}</strong>
        </span>
        <span>
          Active vans:{' '}
          <strong className="text-[var(--text)]">{activeVehicles.length}</strong>
        </span>
        {ran && unassignedNeighborhoodIds.length > 0 && (
          <span>
            Unplaced areas:{' '}
            <strong className="text-[var(--text)]">
              {unassignedNeighborhoodIds.join(', ')}
            </strong>
          </span>
        )}
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Unassigned */}
        <Card className="col-span-12 lg:col-span-3 min-h-[420px]" padding={false}>
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <p className="text-xs tracking-widest uppercase text-[var(--text-muted)]">
              Unassigned
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {unassignedOrders.length} order
              {unassignedOrders.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="p-3 space-y-2 max-h-[560px] overflow-y-auto">
            {unassignedOrders.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)] px-1 py-4 text-center">
                {confirmedOrders.length === 0
                  ? 'No confirmed orders yet.'
                  : 'All confirmed orders are assigned.'}
              </p>
            ) : (
              unassignedOrders.map((o) => (
                <OrderChip key={o.id} order={o} />
              ))
            )}
          </div>
        </Card>

        {/* Vehicle columns */}
        <div className="col-span-12 lg:col-span-9 min-h-[420px]">
          {activeVehicles.length === 0 ? (
            <Card>
              <p className="text-sm text-[var(--text-secondary)]">
                No active vehicles. Configure Fleet first.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeVehicles.map((v) => {
                const list = ordersForVehicle(v.id);
                const state = vehicleStates[v.id];
                const vol = state?.currentVolume ?? list.reduce((s, o) => s + o.volume, 0);
                const pts = state?.currentPoints ?? 0;

                return (
                  <Card key={v.id} padding={false} className="flex flex-col min-h-[280px]">
                    <div className="px-4 py-3 border-b border-[var(--border)]">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-serif text-base font-medium">
                          {v.type}
                          {v.primaryNeighborhood
                            ? ` · ${v.primaryNeighborhood}`
                            : ''}
                        </h3>
                        <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                          {v.city}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {list.length} order{list.length !== 1 ? 's' : ''}
                        {' · '}
                        {vol.toFixed(1)} / {v.capacity} m³
                        {pts > 0 ? ` · ${pts.toFixed(1)} pts` : ''}
                      </p>
                      {/* Capacity bar */}
                      <div className="mt-2 h-1.5 rounded-full bg-[var(--bg-muted)] overflow-hidden">
                        <div
                          className="h-full bg-[var(--text)] transition-all"
                          style={{
                            width: `${Math.min(100, (vol / Math.max(v.capacity, 0.01)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="p-3 space-y-2 flex-1 max-h-[400px] overflow-y-auto">
                      {list.length === 0 ? (
                        <p className="text-xs text-[var(--text-muted)] text-center py-6">
                          Empty — run Auto-Plan
                        </p>
                      ) : (
                        list.map((o) => <OrderChip key={o.id} order={o} />)
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function OrderChip({ order }: { order: Order }) {
  return (
    <div className="px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] text-sm">
      <div className="font-medium truncate">
        {order.custName || order.id}
      </div>
      <div className="text-xs text-[var(--text-muted)] mt-0.5 flex flex-wrap gap-x-2">
        <span>{order.neighborhood || '—'}</span>
        {order.volume > 0 && <span>{order.volume} m³</span>}
        {order.timeSlot && <span>{order.timeSlot}</span>}
        {order.hasAssembly && (
          <span className="uppercase tracking-wider">DA</span>
        )}
      </div>
    </div>
  );
}
