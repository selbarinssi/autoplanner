'use client';

import { useEffect, useState } from 'react';
import type { Vehicle, VehicleType } from '@/domain/types';
import {
  getVehicles,
  upsertVehicle,
  deleteVehicle,
  saveVehicles,
} from '@/lib/repositories/vehicles';
import { getOrders, replaceOrders } from '@/lib/repositories/orders';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

function nextDefaultId(list: Vehicle[]): string {
  const n = list.length + 1;
  return `VAN-${n}`;
}

function emptyVehicle(list: Vehicle[]): Vehicle {
  return {
    id: nextDefaultId(list),
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
  const [originalId, setOriginalId] = useState<string | null>(null);

  useEffect(() => {
    setList(getVehicles());
  }, []);

  function startCreate() {
    const current = getVehicles();
    setEditing(emptyVehicle(current));
    setOriginalId(null);
    setIsNew(true);
  }

  function startEdit(v: Vehicle) {
    setEditing({ ...v, satellites: [...v.satellites] });
    setOriginalId(v.id);
    setIsNew(false);
  }

  function cancel() {
    setEditing(null);
    setIsNew(false);
    setOriginalId(null);
  }

  function save() {
    if (!editing) return;

    const id = editing.id.trim();
    if (!id) {
      alert('Vehicle ID is required (e.g. CAS-01, RBA-TRS-1).');
      return;
    }

    const cleaned: Vehicle = {
      ...editing,
      id,
      city: editing.city.trim(),
      primaryNeighborhood: editing.primaryNeighborhood.trim(),
      capacity: Number(editing.capacity) || 18,
    };

    // Duplicate ID check (when creating or renaming)
    const others = getVehicles().filter((v) => v.id !== originalId);
    if (others.some((v) => v.id === cleaned.id)) {
      alert(`Vehicle ID "${cleaned.id}" is already used.`);
      return;
    }

    let fleet = getVehicles();

    // Rename: update satellite refs + order assignments
    if (originalId && originalId !== cleaned.id) {
      fleet = fleet
        .filter((v) => v.id !== originalId)
        .map((v) => ({
          ...v,
          satellites: v.satellites.map((s) =>
            s === originalId ? cleaned.id : s
          ),
        }));
      fleet.push(cleaned);
      saveVehicles(fleet);

      const orders = getOrders().map((o) =>
        o.assignedTo === originalId ? { ...o, assignedTo: cleaned.id } : o
      );
      replaceOrders(orders);
    } else {
      fleet = upsertVehicle(cleaned);
    }

    setList(fleet);
    setEditing(null);
    setIsNew(false);
    setOriginalId(null);
  }

  function remove(id: string) {
    if (!confirm(`Delete vehicle "${id}"?`)) return;
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
        satellites: sats.filter((sid) => sid !== satelliteId),
      });
    } else {
      setEditing({
        ...editing,
        satellites: [...sats, satelliteId],
      });
    }
  }

  const possibleSatellites = editing
    ? list.filter(
        (v) =>
          v.id !== (originalId ?? editing.id) &&
          v.city.toLowerCase() === editing.city.toLowerCase()
      )
    : [];

  // Group by city for clearer list
  const cities = [...new Set(list.map((v) => v.city || '—'))].sort();

  return (
    <>
      <PageHeader
        title="Fleet"
        description="Each van has a readable ID, city assignment, capacity, and optional satellites. IDs appear on the Plan Board and in Excel export."
        actions={
          <Button size="sm" onClick={startCreate}>
            Add Van
          </Button>
        }
      />

      {editing && (
        <Card className="mb-6 animate-fade-in-scale">
          <h2 className="font-serif text-lg mb-4">
            {isNew ? 'New vehicle' : `Edit · ${originalId}`}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                Vehicle ID *
              </label>
              <input
                className="w-full px-3 py-2 text-sm font-mono border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--bg)] focus:outline-none focus:border-[var(--text)]"
                value={editing.id}
                onChange={(e) =>
                  setEditing({ ...editing, id: e.target.value })
                }
                placeholder="e.g. CAS-01"
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-1">
                Shown on Plan Board and export. Keep it short and unique.
              </p>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                Type
              </label>
              <select
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--bg)] focus:outline-none focus:border-[var(--text)]"
                value={editing.type}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    type: e.target.value as VehicleType,
                  })
                }
              >
                <option value="VAN">VAN</option>
                <option value="EXPRESS">EXPRESS</option>
                <option value="TRUCK">TRUCK</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                City (dispatch)
              </label>
              <input
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--bg)] focus:outline-none focus:border-[var(--text)]"
                value={editing.city}
                onChange={(e) =>
                  setEditing({ ...editing, city: e.target.value })
                }
                placeholder="Casablanca"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                Capacity (m³)
              </label>
              <input
                type="number"
                step="0.1"
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--bg)] focus:outline-none focus:border-[var(--text)]"
                value={editing.capacity}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    capacity: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                Primary neighborhood
              </label>
              <input
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--bg)] focus:outline-none focus:border-[var(--text)]"
                value={editing.primaryNeighborhood}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    primaryNeighborhood: e.target.value,
                  })
                }
                placeholder="e.g. Maarif"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                Start lat (optional)
              </label>
              <input
                type="number"
                step="any"
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--bg)] focus:outline-none focus:border-[var(--text)]"
                value={editing.startLat ?? ''}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    startLat:
                      e.target.value === ''
                        ? null
                        : parseFloat(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                Start lng (optional)
              </label>
              <input
                type="number"
                step="any"
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--bg)] focus:outline-none focus:border-[var(--text)]"
                value={editing.startLng ?? ''}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    startLng:
                      e.target.value === ''
                        ? null
                        : parseFloat(e.target.value),
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
                onChange={(e) =>
                  setEditing({ ...editing, isDown: e.target.checked })
                }
              />
              Mark as DOWN (ignored by auto-plan)
            </label>
          </div>

          <p className="text-xs tracking-wider uppercase text-[var(--text-muted)] mb-3">
            Satellite vehicles (same city)
          </p>
          {possibleSatellites.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              No other vehicles in this city yet.
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
                      ${
                        selected
                          ? 'bg-[var(--text)] text-[var(--text-inverse)] border-[var(--text)]'
                          : 'bg-[var(--bg)] text-[var(--text-secondary)] border-[var(--border-strong)] hover:border-[var(--text)]'
                      }
                    `}
                  >
                    <span className="font-mono text-xs">{s.id}</span>
                    {' · '}
                    {s.type}
                    <span className="opacity-50 ml-1 text-xs">
                      ({s.capacity} m³)
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex gap-2">
            <Button size="sm" onClick={save}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={cancel}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {list.length === 0 ? (
        <Card>
          <p className="text-sm text-[var(--text-secondary)] text-center py-4">
            No vehicles yet. Add your first van.
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {cities.map((city) => {
            const inCity = list.filter((v) => (v.city || '—') === city);
            return (
              <div key={city}>
                <p className="text-xs tracking-widest uppercase text-[var(--text-muted)] mb-3">
                  {city}
                  <span className="ml-2 opacity-60">
                    {inCity.length} van{inCity.length !== 1 ? 's' : ''}
                  </span>
                </p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {inCity.map((v) => {
                    const sats = list.filter((s) =>
                      v.satellites.includes(s.id)
                    );
                    return (
                      <Card
                        key={v.id}
                        className={v.isDown ? 'opacity-55' : ''}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-mono text-base font-semibold tracking-tight">
                                {v.id}
                              </h3>
                              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-muted)]">
                                {v.type}
                              </span>
                              {v.isDown && (
                                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--danger-bg)] text-[var(--danger)]">
                                  Down
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-[var(--text-secondary)] mt-1">
                              <span className="font-medium text-[var(--text)]">
                                {v.city || '—'}
                              </span>
                              {v.primaryNeighborhood
                                ? ` · ${v.primaryNeighborhood}`
                                : ''}
                            </p>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">
                              Capacity {v.capacity} m³
                            </p>
                            {sats.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                <span className="text-[10px] text-[var(--text-muted)]">
                                  Sats:
                                </span>
                                {sats.map((s) => (
                                  <span
                                    key={s.id}
                                    className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                                  >
                                    {s.id}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEdit(v)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => remove(v.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
