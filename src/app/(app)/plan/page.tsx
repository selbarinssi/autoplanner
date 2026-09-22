'use client';

import { useEffect, useMemo, useState } from 'react';
import { exportPlanToExcel } from '@/lib/exportPlanToExcel';
import type { Order, Vehicle, Neighborhood } from '@/domain/types';
import { autoAssign } from '@/domain/assignment/autoAssign';
import type { VehicleState } from '@/domain/assignment/createVehicleState';
import { buildRoutesForAssignment } from '@/domain/routing/buildRoutesForAssignment';
import type { VehicleRoute } from '@/domain/routing/buildRoutesForAssignment';
import { getOrders, replaceOrders, upsertOrder } from '@/lib/repositories/orders';
import { getVehicles } from '@/lib/repositories/vehicles';
import { getNeighborhoods } from '@/lib/repositories/neighborhoods';
import { getClusters } from '@/lib/repositories/clusters';
import { getDispatchConfig } from '@/lib/repositories/dispatchConfig';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const DEFAULT_TRS_SERVICES = [
  'TRS',
  'Click & Collect',
  'C&C',
  'Click and Collect',
];

type DropTarget = string | null; // vehicle id, or null = unassigned

export default function PlanPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [vehicleStates, setVehicleStates] = useState<
    Record<string, VehicleState>
  >({});
  const [routes, setRoutes] = useState<VehicleRoute[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [dragOrderId, setDragOrderId] = useState<string | null>(null);
  const [overTarget, setOverTarget] = useState<DropTarget | 'none'>('none');
  const [showSequence, setShowSequence] = useState(false);

  function reloadAll() {
    setOrders(getOrders());
    setVehicles(getVehicles());
    setNeighborhoods(getNeighborhoods());
  }

  useEffect(() => {
    reloadAll();
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

  function orderedForVehicle(vehicleId: string): Order[] {
    const route = routes.find((r) => r.vehicleId === vehicleId);
    if (route?.orderedOrders.length) return route.orderedOrders;
    return ordersForVehicle(vehicleId);
  }

  function recomputeRoutes(nextOrders: Order[], fleet: Vehicle[], hoods: Neighborhood[]) {
    const built = buildRoutesForAssignment(nextOrders, fleet, hoods);
    setRoutes(built);
  }

  function assignOrder(orderId: string, target: DropTarget) {
    const current = getOrders();
    const order = current.find((o) => o.id === orderId);
    if (!order) return;
    if (order.status !== 'confirmed') return;

    const updated = { ...order, assignedTo: target };
    const next = upsertOrder(updated);
    setOrders(next);

    const fleet = getVehicles();
    const hoods = getNeighborhoods();
    recomputeRoutes(next, fleet, hoods);
  }

  function runAutoPlan() {
    setMessage(null);

    const hoods = getNeighborhoods();
    const clusters = getClusters();
    const config = getDispatchConfig();
    const fleet = getVehicles();
    const currentOrders = getOrders();

    const confirmed = currentOrders.filter((o) => o.status === 'confirmed');

    if (confirmed.length === 0) {
      setMessage(
        'No confirmed orders. Import orders and set status to Confirmed first.'
      );
      return;
    }
    if (fleet.filter((v) => !v.isDown).length === 0) {
      setMessage(
        'No active vehicles. Add vans in Fleet and make sure they are not marked DOWN.'
      );
      return;
    }
    if (hoods.length === 0) {
      setMessage(
        'No neighborhoods configured. Add them under Config → Neighborhoods.'
      );
      return;
    }

    const reset = currentOrders.map((o) =>
      o.status === 'confirmed' ? { ...o, assignedTo: null } : o
    );

    const result = autoAssign(
      reset.filter((o) => o.status === 'confirmed'),
      fleet,
      hoods,
      clusters,
      config,
      DEFAULT_TRS_SERVICES
    );

    const byId = new Map(result.orders.map((o) => [o.id, o]));
    const merged = reset.map((o) => byId.get(o.id) ?? o);

    replaceOrders(merged);
    setOrders(merged);
    setVehicleStates(result.vehicleStates);
    setNeighborhoods(hoods);
    setVehicles(fleet);

    const built = buildRoutesForAssignment(merged, fleet, hoods);
    setRoutes(built);

    const assignedCount = result.orders.filter((o) => o.assignedTo).length;
    const unassignedCount = result.orders.length - assignedCount;
    setMessage(
      `Auto-Plan done: ${assignedCount} assigned, ${unassignedCount} unassigned` +
        (result.unassignedNeighborhoodIds.length
          ? ` · ${result.unassignedNeighborhoodIds.length} area(s) unplaced`
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
    setRoutes([]);
    setMessage('Assignments cleared.');
  }

  function onDragStart(orderId: string) {
    setDragOrderId(orderId);
  }

  function onDragEnd() {
    setDragOrderId(null);
    setOverTarget('none');
  }

  function onDragOver(e: React.DragEvent, target: DropTarget) {
    e.preventDefault();
    setOverTarget(target);
  }

  function onDrop(e: React.DragEvent, target: DropTarget) {
    e.preventDefault();
    const id = dragOrderId || e.dataTransfer.getData('text/plain');
    if (id) assignOrder(id, target);
    setDragOrderId(null);
    setOverTarget('none');
  }

  return (
    <>
      <PageHeader
        title="Plan Board"
        description="Auto-dispatch, then drag orders between vans or unassigned. Sequence uses nearest-neighbor + time slots."
                actions={
          <>
            <Button variant="secondary" size="sm" onClick={reloadAll}>
              Refresh data
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowSequence((s) => !s)}
            >
              {showSequence ? 'Hide sequence' : 'Show sequence'}
            </Button>
            <Button variant="secondary" size="sm" onClick={clearAssignments}>
              Clear plan
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                exportPlanToExcel(
                  getOrders(),
                  getVehicles(),
                  getNeighborhoods()
                )
              }
            >
              Export Excel
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

      <div className="flex flex-wrap gap-3 mb-5 text-xs text-[var(--text-muted)]">
        <span>
          Confirmed:{' '}
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
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Unassigned drop zone */}
        <Card
          className={`col-span-12 lg:col-span-3 min-h-[420px] transition-all ${
            overTarget === null ? 'ring-2 ring-[var(--text)]' : ''
          }`}
          padding={false}
          onDragOver={(e) => onDragOver(e, null)}
          onDragLeave={() => setOverTarget('none')}
          onDrop={(e) => onDrop(e, null)}
        >
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <p className="text-xs tracking-widest uppercase text-[var(--text-muted)]">
              Unassigned
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {unassignedOrders.length} order
              {unassignedOrders.length !== 1 ? 's' : ''} · drop here to unassign
            </p>
          </div>
          <div className="p-3 space-y-2 max-h-[560px] overflow-y-auto min-h-[120px]">
            {unassignedOrders.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)] px-1 py-4 text-center">
                {confirmedOrders.length === 0
                  ? 'No confirmed orders yet.'
                  : 'All confirmed orders are assigned.'}
              </p>
            ) : (
              unassignedOrders.map((o) => (
                <OrderChip
                  key={o.id}
                  order={o}
                  vehicles={activeVehicles}
                  dragging={dragOrderId === o.id}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onManualAssign={assignOrder}
                />
              ))
            )}
          </div>
        </Card>

        {/* Vehicle columns */}
        <div className="col-span-12 lg:col-span-9">
          {activeVehicles.length === 0 ? (
            <Card>
              <p className="text-sm text-[var(--text-secondary)]">
                No active vehicles. Configure Fleet first.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeVehicles.map((v) => {
                const list = showSequence
                  ? orderedForVehicle(v.id)
                  : ordersForVehicle(v.id);
                const state = vehicleStates[v.id];
                const vol =
                  state?.currentVolume ??
                  list.reduce((s, o) => s + o.volume, 0);
                const pts = state?.currentPoints ?? 0;
                const isOver = overTarget === v.id;

                return (
                  <Card
                    key={v.id}
                    padding={false}
                    className={`flex flex-col min-h-[280px] transition-all ${
                      isOver ? 'ring-2 ring-[var(--text)]' : ''
                    }`}
                    onDragOver={(e) => onDragOver(e, v.id)}
                    onDragLeave={() => setOverTarget('none')}
                    onDrop={(e) => onDrop(e, v.id)}
                  >
                    <div className="px-4 py-3 border-b border-[var(--border)]">
                      <div className="flex items-center justify-between gap-2">
                      <h3 className="font-mono text-base font-semibold tracking-tight">
                          {v.id}
                        </h3>
                        <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                          {v.type}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {v.city}
                        {v.primaryNeighborhood
                          ? ` · ${v.primaryNeighborhood}`
                          : ''}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {list.length} order{list.length !== 1 ? 's' : ''}
                        {' · '}
                        {vol.toFixed(1)} / {v.capacity} m³
                        {pts > 0 ? ` · ${pts.toFixed(1)} pts` : ''}
                      </p>
                      <div className="mt-2 h-1.5 rounded-full bg-[var(--bg-muted)] overflow-hidden">
                        <div
                          className="h-full bg-[var(--text)] transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              (vol / Math.max(v.capacity, 0.01)) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="p-3 space-y-2 flex-1 max-h-[400px] overflow-y-auto min-h-[100px]">
                      {list.length === 0 ? (
                        <p className="text-xs text-[var(--text-muted)] text-center py-6">
                          Drop orders here
                        </p>
                      ) : (
                        list.map((o, idx) => (
                          <OrderChip
                            key={o.id}
                            order={o}
                            vehicles={activeVehicles}
                            dragging={dragOrderId === o.id}
                            onDragStart={onDragStart}
                            onDragEnd={onDragEnd}
                            onManualAssign={assignOrder}
                            sequenceIndex={showSequence ? idx + 1 : undefined}
                          />
                        ))
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

function OrderChip({
  order,
  vehicles,
  dragging,
  onDragStart,
  onDragEnd,
  onManualAssign,
  sequenceIndex,
}: {
  order: Order;
  vehicles: Vehicle[];
  dragging: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onManualAssign: (orderId: string, target: DropTarget) => void;
  sequenceIndex?: number;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', order.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(order.id);
      }}
      onDragEnd={onDragEnd}
      className={`
        px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] text-sm
        cursor-grab active:cursor-grabbing select-none
        ${dragging ? 'opacity-40' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-medium truncate flex items-center gap-2">
            {sequenceIndex != null && (
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-4">
                {sequenceIndex}
              </span>
            )}
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
        {/* Manual reassign */}
        <select
          className="text-[10px] max-w-[7rem] px-1 py-0.5 border border-[var(--border)] rounded bg-[var(--bg)] focus:outline-none focus:border-[var(--text)]"
          value={order.assignedTo ?? ''}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            const val = e.target.value;
            onManualAssign(order.id, val === '' ? null : val);
          }}
        >
          <option value="">Unassigned</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.id} · {v.city}
              {v.primaryNeighborhood ? ` · ${v.primaryNeighborhood}` : ''}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
