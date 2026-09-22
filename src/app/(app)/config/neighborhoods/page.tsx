'use client';

import { useEffect, useState } from 'react';
import type { Neighborhood } from '@/domain/types';
import {
  getNeighborhoods,
  upsertNeighborhood,
  deleteNeighborhood,
} from '@/lib/repositories/neighborhoods';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

function emptyNeighborhood(): Neighborhood {
  return {
    id: crypto.randomUUID(),
    name: '',
    city: 'Casablanca',
    lat: 33.5731,
    lng: -7.5898,
    clusterId: null,
  };
}

export default function NeighborhoodsPage() {
  const [list, setList] = useState<Neighborhood[]>([]);
  const [editing, setEditing] = useState<Neighborhood | null>(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    setList(getNeighborhoods());
  }, []);

  function startCreate() {
    setEditing(emptyNeighborhood());
    setIsNew(true);
  }

  function startEdit(n: Neighborhood) {
    setEditing({ ...n });
    setIsNew(false);
  }

  function cancel() {
    setEditing(null);
    setIsNew(false);
  }

  function save() {
    if (!editing || !editing.name.trim()) return;
    const updated = upsertNeighborhood({
      ...editing,
      name: editing.name.trim(),
      city: editing.city.trim(),
    });
    setList(updated);
    setEditing(null);
    setIsNew(false);
  }

  function remove(id: string) {
    if (!confirm('Delete this neighborhood?')) return;
    setList(deleteNeighborhood(id));
  }

  return (
    <>
      <PageHeader
        title="Neighborhoods"
        description="Master list of neighborhoods per city. These feed the clustering engine."
        actions={<Button size="sm" onClick={startCreate}>Add Neighborhood</Button>}
      />

      {/* Editor */}
      {editing && (
        <Card className="mb-6 animate-fade-in-scale">
          <h2 className="font-serif text-lg mb-4">
            {isNew ? 'New neighborhood' : 'Edit neighborhood'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Name</label>
              <input
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--bg)] focus:outline-none focus:border-[var(--text)]"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="e.g. Maarif"
              />
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
              <label className="block text-xs text-[var(--text-muted)] mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--bg)] focus:outline-none focus:border-[var(--text)]"
                value={editing.lat}
                onChange={(e) => setEditing({ ...editing, lat: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--bg)] focus:outline-none focus:border-[var(--text)]"
                value={editing.lng}
                onChange={(e) => setEditing({ ...editing, lng: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <Button size="sm" onClick={save}>Save</Button>
            <Button size="sm" variant="ghost" onClick={cancel}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* List */}
      <Card padding={false}>
        {list.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--text-secondary)]">
            No neighborhoods yet. Click “Add Neighborhood” to create the first one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">City</th>
                  <th className="px-5 py-3 font-medium">Lat</th>
                  <th className="px-5 py-3 font-medium">Lng</th>
                  <th className="px-5 py-3 font-medium w-28"></th>
                </tr>
              </thead>
              <tbody className="stagger">
                {list.map((n) => (
                  <tr
                    key={n.id}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-muted)] transition-colors"
                  >
                    <td className="px-5 py-3 font-medium">{n.name}</td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">{n.city}</td>
                    <td className="px-5 py-3 text-[var(--text-muted)] font-mono text-xs">{n.lat.toFixed(4)}</td>
                    <td className="px-5 py-3 text-[var(--text-muted)] font-mono text-xs">{n.lng.toFixed(4)}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => startEdit(n)}>Edit</Button>
                        <Button size="sm" variant="danger" onClick={() => remove(n.id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
