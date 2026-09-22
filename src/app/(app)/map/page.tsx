'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Order, Vehicle, Neighborhood } from '@/domain/types';
import { getOrders } from '@/lib/repositories/orders';
import { getVehicles } from '@/lib/repositories/vehicles';
import { getNeighborhoods } from '@/lib/repositories/neighborhoods';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { RouteMap } from '@/components/map/RouteMap';

export default function MapPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null
  );

  function reload() {
    setOrders(getOrders());
    setVehicles(getVehicles());
    setNeighborhoods(getNeighborhoods());
  }

  useEffect(() => {
    reload();
  }, []);

  const activeWithOrders = useMemo(() => {
    const ids = new Set(
      orders.filter((o) => o.assignedTo).map((o) => o.assignedTo as string)
    );
    return vehicles.filter((v) => !v.isDown && ids.has(v.id));
  }, [orders, vehicles]);

  const assignedCount = orders.filter((o) => o.assignedTo).length;

  return (
    <>
      <PageHeader
        title="Map"
        description="Routes from the current plan. Sequence = nearest-neighbor + time slots; geometry from OSRM when available."
        actions={
          <Button size="sm" variant="secondary" onClick={reload}>
            Refresh
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => setSelectedVehicleId(null)}
          className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
            selectedVehicleId === null
              ? 'bg-[var(--text)] text-[var(--text-inverse)] border-[var(--text)]'
              : 'border-[var(--border-strong)] text-[var(--text-secondary)]'
          }`}
        >
          All routes ({activeWithOrders.length})
        </button>
        {activeWithOrders.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setSelectedVehicleId(v.id)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
              selectedVehicleId === v.id
                ? 'bg-[var(--text)] text-[var(--text-inverse)] border-[var(--text)]'
                : 'border-[var(--border-strong)] text-[var(--text-secondary)]'
            }`}
          >
            {v.type}
            {v.primaryNeighborhood ? ` · ${v.primaryNeighborhood}` : ''}
          </button>
        ))}
      </div>

      {assignedCount === 0 ? (
        <Card>
          <p className="text-sm text-[var(--text-secondary)]">
            No assigned orders. Run Auto-Plan on the Plan Board first. Neighborhoods
            need lat/lng so stops can be placed.
          </p>
        </Card>
      ) : (
        <div className="h-[calc(100vh-220px)] min-h-[480px]">
          <RouteMap
            orders={orders}
            vehicles={vehicles}
            neighborhoods={neighborhoods}
            selectedVehicleId={selectedVehicleId}
          />
        </div>
      )}

      <p className="mt-3 text-[10px] text-[var(--text-muted)]">
        MapLibre · demo tiles · routing via public OSRM (fallback: straight lines).
        © OpenStreetMap contributors when using OSM-derived data.
      </p>
    </>
  );
}
