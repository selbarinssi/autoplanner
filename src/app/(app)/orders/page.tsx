'use client';

import { useEffect, useRef, useState } from 'react';
import type { Order, OrderStatus } from '@/domain/types';
import {
  getOrders,
  replaceOrders,
  clearOrders,
  upsertOrder,
  deleteOrder,
} from '@/lib/repositories/orders';
import { parseOrdersFromExcel } from '@/lib/parseOrdersFromExcel';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const STATUS_LABELS: Record<OrderStatus, string> = {
  confirmed: 'Confirmed',
  unreachable: 'Unreachable',
  postponed: 'Postponed',
  cancelled: 'Cancelled',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [importing, setImporting] = useState(false);
  const [lastImport, setLastImport] = useState<{
  count: number;
  errors: string[];
  sheetName?: string;
} | null>(null);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setOrders(getOrders());
  }, []);

  async function handleFile(file: File) {
  setImporting(true);
  setLastImport(null);
  try {
    const buffer = await file.arrayBuffer();
    const result = parseOrdersFromExcel(buffer);
    if (result.orders.length === 0) {
      setLastImport({
        count: 0,
        errors: result.errors.length
          ? result.errors
          : ['No valid orders found in file'],
        sheetName: result.sheetName,
      });
      return;
    }
    const next = replaceOrders(result.orders);
    setOrders(next);
    setLastImport({
      count: result.orders.length,
      errors: result.errors,
      sheetName: result.sheetName,
    });
  } catch (err) {
    setLastImport({
      count: 0,
      errors: [err instanceof Error ? err.message : 'Failed to parse file'],
      sheetName: '',
    });
  } finally {
    setImporting(false);
    if (fileRef.current) fileRef.current.value = '';
  }
}

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  }

  function handleClear() {
    if (!confirm('Clear all loaded orders?')) return;
    setOrders(clearOrders());
    setLastImport(null);
  }

  function setStatus(order: Order, status: OrderStatus) {
    setOrders(upsertOrder({ ...order, status }));
  }

  function remove(id: string) {
    if (!confirm('Delete this order?')) return;
    setOrders(deleteOrder(id));
  }

  const filtered =
    filterStatus === 'all'
      ? orders
      : orders.filter((o) => o.status === filterStatus);

  const counts = {
    all: orders.length,
    confirmed: orders.filter((o) => o.status === 'confirmed').length,
    unreachable: orders.filter((o) => o.status === 'unreachable').length,
    postponed: orders.filter((o) => o.status === 'postponed').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  return (
    <>
      <PageHeader
        title="Orders & Calls"
        description="Import daily orders from CSV, then confirm statuses before planning."
        actions={
          <div className="flex gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={onInputChange}
            />
            <Button
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={importing}
            >
              {importing ? 'Importing…' : 'Import CSV'}
            </Button>
            {orders.length > 0 && (
              <Button size="sm" variant="danger" onClick={handleClear}>
                Clear all
              </Button>
            )}
          </div>
        }
      />

      {lastImport && (
        <Card className="mb-6">
          <p className="text-sm">
            {lastImport.count > 0 ? (
              <>
                Imported <strong>{lastImport.count}</strong> order
                {lastImport.count !== 1 ? 's' : ''}.
              </>
            ) : (
              'Import finished with no orders.'
            )}
          </p>
          {lastImport.errors.length > 0 && (
            <ul className="mt-2 text-xs text-[var(--danger)] space-y-0.5 max-h-24 overflow-y-auto">
              {lastImport.errors.slice(0, 10).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
              {lastImport.errors.length > 10 && (
                <li>…and {lastImport.errors.length - 10} more</li>
              )}
            </ul>
          )}
        </Card>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {(
          [
            ['all', 'All'],
            ['confirmed', 'Confirmed'],
            ['unreachable', 'Unreachable'],
            ['postponed', 'Postponed'],
            ['cancelled', 'Cancelled'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilterStatus(key)}
            className={`
              px-3 py-1.5 text-xs rounded-full border transition-all
              ${
                filterStatus === key
                  ? 'bg-[var(--text)] text-[var(--text-inverse)] border-[var(--text)]'
                  : 'bg-[var(--bg)] text-[var(--text-secondary)] border-[var(--border-strong)] hover:border-[var(--text)]'
              }
            `}
          >
            {label}
            <span className="opacity-60 ml-1.5">{counts[key]}</span>
          </button>
        ))}
      </div>

      <Card padding={false}>
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--text-secondary)]">
            {orders.length === 0
              ? 'No orders yet. Export Excel as CSV, then click “Import CSV”.'
              : 'No orders match this filter.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">City / Area</th>
                  <th className="px-4 py-3 font-medium">Vol</th>
                  <th className="px-4 py-3 font-medium">Slot</th>
                  <th className="px-4 py-3 font-medium">Services</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium w-24"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-muted)] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{o.custName || '—'}</div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {o.custPhone || o.id}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{o.neighborhood || '—'}</div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {o.city}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {o.volume > 0 ? `${o.volume}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {o.timeSlot || '—'}
                      {o.hasAssembly && (
                        <span className="ml-1 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                          DA
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-secondary)] max-w-[12rem] truncate">
                      {o.services.length ? o.services.join(', ') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="text-xs px-2 py-1 border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--bg)] focus:outline-none focus:border-[var(--text)]"
                        value={o.status}
                        onChange={(e) =>
                          setStatus(o, e.target.value as OrderStatus)
                        }
                      >
                        {(Object.keys(STATUS_LABELS) as OrderStatus[]).map(
                          (s) => (
                            <option key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </option>
                          )
                        )}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => remove(o.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="mt-4 text-xs text-[var(--text-muted)] leading-relaxed max-w-2xl">
        Use CSV only (Excel → Save As → CSV). Columns detected automatically:
        id, city/ville, neighborhood/quartier, volume, value/montant, services,
        assembly/montage, timeslot/créneau, customer/client, phone/téléphone,
        status/statut. Import replaces the current list.
      </p>
    </>
  );
}
