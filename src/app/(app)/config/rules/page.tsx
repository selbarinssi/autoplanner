'use client';

import { useEffect, useState } from 'react';
import type { CriterionConfig, CriterionKey, DispatchConfig } from '@/domain/types';
import {
  getDispatchConfig,
  saveDispatchConfig,
  resetDispatchConfig,
} from '@/lib/repositories/dispatchConfig';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const CRITERION_LABELS: Record<CriterionKey, string> = {
  trs_priority: 'TRS priority',
  primary_neighborhood: 'Primary neighborhood',
  adjacent_neighborhood: 'Adjacent neighborhood',
  same_city: 'Same city',
  volume_packing: 'Volume packing',
  productivity_packing: 'Productivity packing',
  geographic_continuity: 'Geographic continuity',
  express_preference: 'Express preference',
  cluster_size: 'Cluster size',
  time_slot_conflict: 'Time-slot conflict',
  overflow: 'Overflow',
};

const CRITERION_HINTS: Record<CriterionKey, string> = {
  trs_priority: 'Hard preference for TRS / high-priority orders',
  primary_neighborhood: 'Match vehicle primary area',
  adjacent_neighborhood: 'Prefer nearby neighborhoods',
  same_city: 'Keep vehicle inside its city',
  volume_packing: 'How well the order fits remaining volume',
  productivity_packing: 'How well the order fits remaining points',
  geographic_continuity: 'Keep route geographically continuous',
  express_preference: 'Prefer EXPRESS vehicles for express orders',
  cluster_size: 'Prefer balanced cluster sizes',
  time_slot_conflict: 'Penalise conflicting time slots',
  overflow: 'Soft penalty when slightly over capacity',
};

export default function RulesPage() {
  const [config, setConfig] = useState<DispatchConfig | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  useEffect(() => {
    setConfig(getDispatchConfig());
  }, []);

  function persist(next: DispatchConfig) {
    setConfig(next);
    saveDispatchConfig(next);
  }

  function updateCriterion(index: number, patch: Partial<CriterionConfig>) {
    if (!config) return;
    const criteria = config.criteria.map((c, i) =>
      i === index ? { ...c, ...patch } : c
    );
    persist({ ...config, criteria });
  }

  function updateGlobal(patch: Partial<DispatchConfig>) {
    if (!config) return;
    persist({ ...config, ...patch });
  }

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setOverIndex(index);
  }

  function handleDrop(index: number) {
    if (!config || dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const criteria = [...config.criteria];
    const [moved] = criteria.splice(dragIndex, 1);
    criteria.splice(index, 0, moved);
    persist({ ...config, criteria });
    setDragIndex(null);
    setOverIndex(null);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setOverIndex(null);
  }

  function handleReset() {
    if (!confirm('Reset all rules and global parameters to defaults?')) return;
    const next = resetDispatchConfig();
    setConfig(next);
  }

  if (!config) return null;

  return (
    <>
      <PageHeader
        title="Dispatch Rules"
        description="Reorder criteria by priority (top = highest). Toggle, adjust weights, and tune global parameters. Changes save automatically."
        actions={
          <Button size="sm" variant="secondary" onClick={handleReset}>
            Reset to defaults
          </Button>
        }
      />

      {/* Global parameters */}
      <Card className="mb-6">
        <h2 className="font-serif text-lg mb-4">Global parameters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">
              Max points per vehicle
            </label>
            <input
              type="number"
              step="1"
              min="1"
              className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--bg)] focus:outline-none focus:border-[var(--text)]"
              value={config.maxPoints}
              onChange={(e) =>
                updateGlobal({ maxPoints: parseFloat(e.target.value) || 20 })
              }
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">
              Delivery point cost
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--bg)] focus:outline-none focus:border-[var(--text)]"
              value={config.deliveryPointCost}
              onChange={(e) =>
                updateGlobal({
                  deliveryPointCost: parseFloat(e.target.value) || 1,
                })
              }
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">
              Assembly point cost
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--bg)] focus:outline-none focus:border-[var(--text)]"
              value={config.assemblyPointCost}
              onChange={(e) =>
                updateGlobal({
                  assemblyPointCost: parseFloat(e.target.value) || 2.5,
                })
              }
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">
              Adjacency radius (km)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--bg)] focus:outline-none focus:border-[var(--text)]"
              value={config.adjacencyKm}
              onChange={(e) =>
                updateGlobal({ adjacencyKm: parseFloat(e.target.value) || 5 })
              }
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">
              Dedicated volume threshold
            </label>
            <input
              type="number"
              step="0.05"
              min="0"
              max="1"
              className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--bg)] focus:outline-none focus:border-[var(--text)]"
              value={config.dedicatedVolumeThreshold}
              onChange={(e) =>
                updateGlobal({
                  dedicatedVolumeThreshold: parseFloat(e.target.value) || 0.6,
                })
              }
            />
            <p className="text-[10px] text-[var(--text-muted)] mt-1">
              0–1 (e.g. 0.6 = 60% of capacity → dedicated vehicle)
            </p>
          </div>
        </div>
      </Card>

      {/* Criteria list */}
      <p className="text-xs tracking-wider uppercase text-[var(--text-muted)] mb-3">
        Priority order (drag to reorder)
      </p>

      <div className="space-y-2">
        {config.criteria.map((c, index) => {
          const isDragging = dragIndex === index;
          const isOver = overIndex === index && dragIndex !== index;

          return (
            <div
              key={c.key}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
              className={`
                flex items-center gap-3 p-4
                bg-[var(--bg-elevated)] border rounded-[var(--radius)]
                shadow-[var(--shadow-sm)]
                cursor-grab active:cursor-grabbing
                transition-all duration-150
                ${isDragging ? 'opacity-40 scale-[0.98]' : ''}
                ${isOver ? 'border-[var(--text)] ring-1 ring-[var(--text)]' : 'border-[var(--border)]'}
                ${!c.enabled ? 'opacity-55' : ''}
              `}
            >
              {/* Drag handle + rank */}
              <div className="flex items-center gap-2 flex-shrink-0 text-[var(--text-muted)] select-none">
                <span className="text-lg leading-none">⠿</span>
                <span className="text-xs font-mono w-5 text-right">
                  {index + 1}
                </span>
              </div>

              {/* Enable toggle */}
              <label className="flex items-center gap-2 flex-shrink-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={c.enabled}
                  onChange={(e) =>
                    updateCriterion(index, { enabled: e.target.checked })
                  }
                  onClick={(e) => e.stopPropagation()}
                />
              </label>

              {/* Label + hint */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {CRITERION_LABELS[c.key] ?? c.key}
                </p>
                <p className="text-xs text-[var(--text-muted)] truncate">
                  {CRITERION_HINTS[c.key] ?? ''}
                </p>
              </div>

              {/* Weight */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <label className="text-xs text-[var(--text-muted)]">Weight</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  className="w-20 px-2 py-1.5 text-sm text-right border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--bg)] focus:outline-none focus:border-[var(--text)] font-mono"
                  value={c.weight}
                  onChange={(e) =>
                    updateCriterion(index, {
                      weight: parseFloat(e.target.value) || 0,
                    })
                  }
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
