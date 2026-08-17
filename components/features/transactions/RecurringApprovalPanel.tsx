'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { useToast } from '@/hooks/useToast';
import { formatDate } from '@/lib/date';
import type { PendingRecurring } from '@/store/transactionStore';

export interface RecurringApprovalPanelProps {
  items: PendingRecurring[];
  loading: boolean;
  onApprove: (items: { transactionId: string; dueDate: string }[]) => Promise<{ approved: number; skipped: number }>;
}

const selectionKey = (item: PendingRecurring) => `${item.transactionId}:${item.dueDate}`;

export function RecurringApprovalPanel({ items, loading, onApprove }: RecurringApprovalPanelProps) {
  const { addToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  // Keep the auto-selection in sync when the pending list changes (React's
  // recommended "adjust state when a prop changes" pattern).
  const [prevItems, setPrevItems] = useState<PendingRecurring[]>(items);
  if (items !== prevItems) {
    setPrevItems(items);
    setSelected(new Set(items.map(selectionKey)));
  }

  const handleOpen = () => {
    setSelected(new Set(items.map(selectionKey)));
    setIsOpen(true);
  };

  if (loading && items.length === 0) {
    return (
      <Card className="bg-tertiary-container/10 border border-tertiary/30 px-lg py-md" glass={false}>
        <div className="flex items-center justify-center gap-2 text-sm text-on-surface-variant">
          <div className="w-4 h-4 border-2 border-tertiary/30 border-t-tertiary rounded-full animate-spin"></div>
          Checking recurring transactions...
        </div>
      </Card>
    );
  }

  if (items.length === 0) return null;

  const allSelected = items.length > 0 && items.every((item) => selected.has(selectionKey(item)));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map(selectionKey)));
    }
  };

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleApprove = async () => {
    const chosen = items
      .filter((item) => selected.has(selectionKey(item)))
      .map((item) => ({ transactionId: item.transactionId, dueDate: item.dueDate }));
    if (chosen.length === 0) {
      addToast('Select at least one recurring transaction to approve', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const result = await onApprove(chosen);
      addToast(
        result.skipped > 0
          ? `Approved ${result.approved} recurring transaction(s) (${result.skipped} already added)`
          : `${result.approved} recurring transaction(s) added to your ledger`,
        'success'
      );
      setIsOpen(false);
    } catch {
      addToast('Failed to approve recurring transactions', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <>
      <Card
        className="bg-tertiary-container/10 border border-tertiary/40 px-lg py-md backdrop-blur-sm"
        glass={false}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 shrink-0 rounded-xl bg-tertiary/15 text-tertiary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">autorenew</span>
            </span>
            <div className="min-w-0">
              <h4 className="font-title-md text-title-md font-bold text-tertiary flex items-center gap-2">
                Recurring transactions awaiting approval
                <span className="px-2 py-0.5 rounded-full bg-tertiary text-on-tertiary text-[10px] font-bold">
                  {items.length}
                </span>
              </h4>
              <p className="font-label-md text-label-md text-on-surface-variant truncate">
                These are recurring entries due later this month — approve them to add them to your ledger.
              </p>
            </div>
          </div>
          <Button variant="tertiary" onClick={handleOpen} className="shrink-0">
            <span className="material-symbols-outlined text-sm">checklist</span>
            Take action
          </Button>
        </div>

        {/* Faded preview of the pending items */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {items.slice(0, 3).map((item) => (
            <div
              key={selectionKey(item)}
              className="px-3 py-2.5 rounded-lg border border-tertiary/20 bg-white/40 opacity-70 transition-opacity hover:opacity-90"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-body-md text-body-md text-on-surface font-semibold truncate">{item.title}</span>
                <span className="font-mono-data text-mono-data font-bold text-tertiary shrink-0">
                  {item.currency} {Number(item.amount).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-1">
                <span className="text-[10px] text-on-surface-variant font-medium truncate">
                  {item.category || '—'} · recurs on {formatDate(item.dueDate)}
                </span>
                <span className="text-[10px] text-tertiary font-bold shrink-0">Due {formatDate(item.dueDate)}</span>
              </div>
            </div>
          ))}
          {items.length > 3 && (
            <div className="px-3 py-2.5 rounded-lg border border-tertiary/20 bg-white/40 opacity-70 flex items-center justify-center">
              <span className="text-xs text-on-surface-variant font-semibold">+{items.length - 3} more waiting</span>
            </div>
          )}
        </div>
      </Card>

      {/* Approval modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Approve recurring transactions"
        subtitle={`${items.length} recurring transaction(s) due this window · Total ${items[0]?.currency || ''} ${totalAmount.toFixed(2)}`}
        maxWidth="max-w-3xl"
        dismissible={false}
      >
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
          <label className="flex items-center gap-2 text-body-md text-on-surface font-semibold cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="w-4 h-4 accent-[var(--color-tertiary)]"
            />
            Select all
          </label>
          <span className="font-label-md text-label-md text-on-surface-variant">
            {selected.size} of {items.length} selected
          </span>
        </div>

        <div className="w-full overflow-x-auto mt-3 max-h-[50vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <span className="sr-only">Approve</span>
                </TableHead>
                <TableHead>Title / Merchant</TableHead>
                <TableHead>Category</TableHead>
                <TableHead align="right">Amount</TableHead>
                <TableHead>Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const key = selectionKey(item);
                const checked = selected.has(key);
                return (
                  <TableRow key={key} className={checked ? 'bg-tertiary-container/5' : ''}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(key)}
                        className="w-4 h-4 accent-[var(--color-tertiary)] cursor-pointer"
                      />
                    </TableCell>
                    <TableCell>
                      <span className="text-primary font-bold">{item.title}</span>
                      {item.merchant && item.merchant !== item.title && (
                        <span className="block text-[10px] text-on-surface-variant mt-0.5">{item.merchant}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-0.5 bg-tertiary-container/20 text-tertiary rounded-full text-[10px] font-bold">
                        {item.category || '—'}
                      </span>
                    </TableCell>
                    <TableCell align="right" className="font-mono-data text-mono-data font-bold text-primary">
                      {item.currency} {Number(item.amount).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-on-surface-variant font-medium">{formatDate(item.dueDate)}</TableCell>
                  </TableRow>
                );
              })}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-on-surface-variant italic">
                    No recurring transactions pending.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant mt-4">
          <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button type="button" variant="tertiary" onClick={handleApprove} disabled={submitting || selected.size === 0}>
            <span className="material-symbols-outlined text-sm">task_alt</span>
            {submitting ? 'Approving...' : `Approve (${selected.size})`}
          </Button>
        </div>
      </Modal>
    </>
  );
}