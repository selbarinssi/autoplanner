'use client';

import { useEffect, useState } from 'react';
import type { Cluster, Neighborhood } from '@/domain/types';
import {
  getClusters,
  upsertCluster,
  deleteCluster,
} from '@/lib/repositories/clusters';
import {
  getNeighborhoods,
  upsertNeighborhood,
} from '@/lib/repositories/neighborhoods';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

function emptyCluster(): Cluster {
  return {
    id: crypto.randomUUID(),
    name: '',
    city: 'Casablanca',
    neighborhoodIds: [],
  };
}

export default function ClustersPage() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [editing, setEditing] = useState<Cluster | null>(null);
  const [isNew, setIsNew] = useState(false);

  function reload() {
    setClusters(getClusters());
    setNeighborhoods(getNeighborhoods());
  }

  useEffect(() => {
    reload();
  }, []);

  function startCreate() {
    setEditing(emptyCluster());
    setIsNew(true);
  }

  function startEdit(c: Cluster) {
    setEditing({ ...c, neighborhoodIds: [...c.neighborhoodIds] });
    setIsNew(false);
  }

  function cancel() {
    setEditing(null);
    setIsNew(false);
  }

  function save() {
    if (!editing || !editing.name.trim()) return;

    const cleaned: Cluster = {
      ...editing,
      name: editing.name.trim(),
      city: editing.city.trim(),
    };

    // Update cluster
    const updatedClusters = upsertCluster(cleaned);

    // Sync neighborhood.clusterId
    const allNeighborhoods = getNeighborhoods();
    for (const n of allNeighborhoods) {
      const shouldBelong = cleaned.neighborhoodIds.includes(n.id);
      const currentlyBelongs = n.clusterId === cleaned.id;

      if (shouldBelong && !currentlyBelongs) {
        upsertNeighborhood({ ...n, clusterId: cleaned.id });
      } else if (!shouldBelong && currentlyBelongs) {
        upsertNeighborhood({ ...n, clusterId: null });
      }
    }

    // Also clear this cluster id from neighborhoods that were removed from other clusters' perspective
    setClusters(updatedClusters);
    setNeighborhoods(getNeighborhoods());
    setEditing(null);
    setIsNew(false);
  }

  function remove(id: string) {
    if (!confirm('Delete this cluster? Neighborhoods will become unassigned.')) return;

    // Unlink neighborhoods
    const all = getNeighborhoods();
    for (const n of all) {
      if (n.clusterId === id) {
        upsertNeighborhood({ ...n, clusterId: null });
      }
    }

    setClusters(deleteCluster(id));
    setNeighborhoods(getNeighborhoods());
  }

  function toggleNeighborhood(neighborhoodId: string) {
    if (!editing) return;
    const ids = editing.neighborhoodIds;
    if (ids.includes(neighborhoodId)) {
      setEditing({
        ...editing,
        neighborhoodIds: ids.filter((id) => id !== neighborhoodId),
      });
    } else {
      setEditing({
        ...editing,
        neighborhoodIds: [...ids, neighborhoodId],
      });
    }
  }

  // Neighborhoods available for the city of the cluster being edited
  const availableNeighborhoods = editing
    ? neighborhoods.filter((n) => n.city.toLowerCase() === editing.city.toLowerCase())
    : [];

  return (
    <>
      <PageHeader
        title="Clusters"
        description="Group low-volume neighborhoods into clusters. High-volume ones can still get dedicated vans."
        actions={<Button size="sm" onClick={startCreate}>New Cluster</Button>}
      />

      {/* Editor */}
      {editing && (
        <Card className="mb-6 animate-fade-in-scale">
          <h2 className="font-serif text-lg mb-4">
            {isNew ? 'New cluster' : 'Edit cluster'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Cluster name</label>
              <input
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--bg)] focus:outline-none focus:border-[var(--text)]"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="e.g. Casa Centre"
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
          </div>

          <p className="text-xs tracking-wider uppercase text-[var(--text-muted)] mb-3">
            Neighborhoods in this cluster
          </p>

          {availableNeighborhoods.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              No neighborhoods found for this city. Create some in the Neighborhoods page first.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 mb-6">
              {availableNeighborhoods.map((n) => {
                const selected = editing.neighborhoodIds.includes(n.id);
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => toggleNeighborhood(n.id)}
                    className={`
                      px-3 py-1.5 text-sm rounded-full border transition-all duration-150
                      ${selected
                        ? 'bg-[var(--text)] text-[var(--text-inverse)] border-[var(--text)]'
                        : 'bg-[var(--bg)] text-[var(--text-secondary)] border-[var(--border-strong)] hover:border-[var(--text)]'
                      }
                    `}
                  >
                    {n.name}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex gap-2">
            <Button size="sm" onClick={save}>Save cluster</Button>
            <Button size="sm" variant="ghost" onClick={cancel}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* List of clusters */}
      <div className="grid gap-4 stagger">
        {clusters.length === 0 ? (
          <Card>
            <p className="text-sm text-[var(--text-secondary)] text-center py-4">
              No clusters yet. Create one and assign neighborhoods to it.
            </p>
          </Card>
        ) : (
          clusters.map((c) => {
            const members = neighborhoods.filter((n) => n.clusterId === c.id);
            return (
              <Card key={c.id} className="animate-fade-in">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-lg font-medium">{c.name}</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{c.city}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {members.length === 0 ? (
                        <span className="text-xs text-[var(--text-muted)]">No neighborhoods</span>
                      ) : (
                        members.map((m) => (
                          <span
                            key={m.id}
                            className="px-2 py-0.5 text-xs rounded-full bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                          >
                            {m.name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(c)}>Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => remove(c.id)}>Delete</Button>
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
