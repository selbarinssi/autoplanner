'use client';

import { useEffect, useState } from 'react';
import type { Vehicle, VehicleType } from '@/domain/types';
import {
  getVehicles,
  upsertVehicle,
  deleteVehicle,
} from '@/lib/repositories/vehicles';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

function emptyVehicle(): Vehicle {
  return {
    id: crypto.randomUUID(),
    type: 'VAN',
    capacity: 18,
    city: 'Casablanca',
    primaryNeighborhood: '',
    startLat: null,
    startLng: null,
    satellites: [],
    isDown: false,
  };
}

export default function FleetPage() {
  const [list, setList] = useState<Vehicle[]>([]);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    setList(getVehicles());
  }, []);

  function startCreate() {
    setEditing(emptyVehicle());
    setIsNew(true);
  }

  function startEdit(v: Vehicle) {
    setEditing({ ...v, satellites: [...v.satellites] });
    setIsNew(false);
  }

  function cancel() {
    setEditing(null);
    setIsNew(false);
  }

  function save() {
    if (!editing) return;
    const cleaned: Vehicle = {
      ...editing,
      city: editing.city.trim(),
      primaryNeighborhood: editing.primaryNeighborhood.trim(),
      capacity: Number(editing.capacity) || 18,
    };
    const updated = upsertVehicle(cleaned);
    setList(updated);
    setEditing(null);
    setIsNew(false);
  }

  function remove(id: string) {
    if (!confirm('Delete this vehicle?')) return;
    // Also remove it from any other vehicle's satellites list
    const all = getVehicles();
    for (const v of all) {
      if (v.satellites.includes(id)) {
        upsertVehicle({
          ...v,
          satellites: v.satellites.filter((s) => s !== id),
        });
      }
    }
    setList(deleteVehicle(id));
  }

  function toggleSatellite(satelliteId: string) {
    if (!editing) return;
    const sats = editing.satellites;
    if (sats.includes(satelliteId)) {
      setEditing({
        ...editing,
        satellites: sats.filter((id) => id !== satelliteId),
      });
    } else {
      setEditing({
        ...editing,
        satellites: [...sats, satelliteId],
      });
    }
  }

  // Possible satellites = other vehicles of the same city (not self)
  const possibleSatellites = editing
    ? list.filter(
        (v) =>
          v.id !== editing.id &&
          v.city.toLowerCase() === editing.city.toLowerCase()
      )
    : [];

  return (
    <>
      <PageHeader
        title="Fleet"
        description="Vans receive orders. Attach satellite vehicles from the same city. Productivity of a satellite only applies once a team is assigned to it (later)."
        actions={<Button size="sm" onClick={startCreate}>Add Van</Button>}
      />

      {/* Editor */}
      {editing && (
        <Card className="mb-6 animate-fade-in-scale">
          <h2 className="font-serif text-lg mb-4">
            {isNew ? 'New vehicle' : 'Edit vehicle'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Type</label>
              <select
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--bg)] focus:outline-none focus:border-[var(--text)]"
                value={editing.type}
                onChange={(e) =>
                  setEditing({ ...editing, type: e.target.value as VehicleType })
                }
              >
                <option value="VAN">VAN</option>
                <option value="EXPRESS">EXPRESS</option>
                <option value="TRUCK">TRUCK</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">City</label>
              <input
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--bg)] focus:outline-none focus:border-[var(--text)]"
                value={editing.city}
                onChange={(e) => setEditing({ ...editing, city: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Capacity (m³)</label>
              <input
                type="number"
                step="0.1"
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--bg)] focus:outline-none focus:border-[var(--text)]"
                value={editing.capacity}
                onChange={(e) =>
                  setEditing({ ...editing, capacity: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Primary neighborhood</label>
              <input
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--bg)] focus:outline-none focus:border-[var(--text)]"
                value={editing.primaryNeighborhood}
                onChange={(e) =>
                  setEditing({ ...editing, primaryNeighborhood: e.target.value })
                }
                placeholder="e.g. Maarif"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Start lat (optional)</label>
              <input
                type="number"
                step="any"
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--bg)] focus:outline-none focus:border-[var(--text)]"
                value={editing.startLat ?? ''}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    startLat: e.target.value === '' ? null : parseFloat(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Start lng (optional)</label>
              <input
                type="number"
                step="any"
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--bg)] focus:outline-none focus:border-[var(--text)]"
                value={editing.startLng ?? ''}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    startLng: e.target.value === '' ? null : parseFloat(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={editing.isDown}
                onChange={(e) => setEditing({ ...editing, isDown: e.target.checked })}
              />
              Mark as DOWN (ignored by auto-plan)
            </label>
          </div>

          {/* Satellites */}
          <p className="text-xs tracking-wider uppercase text-[var(--text-muted)] mb-3">
            Satellite vehicles (same city)
          </p>
          {possibleSatellites.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              No other vehicles in this city yet. Add more vans first, then attach them here.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 mb-6">
              {possibleSatellites.map((s) => {
                const selected = editing.satellites.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSatellite(s.id)}
                    className={`
                      px-3 py-1.5 text-sm rounded-full border transition-all duration-150
                      ${selected
                        ? 'bg-[var(--text)] text-[var(--text-inverse)] border-[var(--text)]'
                        : 'bg-[var(--bg)] text-[var(--text-secondary)] border-[var(--border-strong)] hover:border-[var(--text)]'
                      }
                    `}
                  >
                    {s.type} · {s.primaryNeighborhood || s.city}
                    <span className="opacity-50 ml-1 text-xs">
                      ({s.capacity} m³)
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex gap-2">
            <Button size="sm" onClick={save}>Save</Button>
            <Button size="sm" variant="ghost" onClick={cancel}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* List */}
      <div className="grid gap-4 stagger">
        {list.length === 0 ? (
          <Card>
            <p className="text-sm text-[var(--text-secondary)] text-center py-4">
              No vehicles yet. Add your first van.
            </p>
          </Card>
        ) : (
          list.map((v) => {
            const sats = list.filter((s) => v.satellites.includes(s.id));
            return (
              <Card key={v.id} className={v.isDown ? 'opacity-55' : ''}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-lg font-medium">
                        {v.type}
                      </h3>
                      {v.isDown && (
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--danger-bg)] text-[var(--danger)]">
                          Down
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {v.city}
                      {v.primaryNeighborhood ? ` · ${v.primaryNeighborhood}` : ''}
                      {' · '}
                      {v.capacity} m³
                    </p>

                    {sats.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        <span className="text-xs text-[var(--text-muted)] mr-1">Satellites:</span>
                        {sats.map((s) => (
                          <span
                            key={s.id}
                            className="px-2 py-0.5 text-xs rounded-full bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                          >
                            {s.type} · {s.primaryNeighborhood || s.city}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(v)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => remove(v.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </>
  );
}
