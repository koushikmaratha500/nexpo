'use client';

import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { parseTransactionCalendarDate } from '@/lib/date';
import type { Transaction } from '@/store/transactionStore';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_VISIBLE_EVENTS = 3;

function ymdKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export interface TransactionCalendarGridProps {
  /** Anchor month for the grid (any date within the month). */
  monthAnchor: Date;
  transactions: Transaction[];
  onSelectTransaction?: (transaction: Transaction) => void;
  onSelectDay?: (date: Date, dayTransactions: Transaction[]) => void;
}

export function TransactionCalendarGrid({
  monthAnchor,
  transactions,
  onSelectTransaction,
  onSelectDay,
}: TransactionCalendarGridProps) {
  const [expandedDayKey, setExpandedDayKey] = useState<string | null>(null);

  const todayKey = ymdKey(new Date());

  const byDay = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const txn of transactions) {
      const d = parseTransactionCalendarDate(txn.date);
      if (!d) continue;
      const key = ymdKey(d);
      const list = map.get(key) ?? [];
      list.push(txn);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (parseTransactionCalendarDate(b.date)?.getTime() ?? 0) - (parseTransactionCalendarDate(a.date)?.getTime() ?? 0));
    }
    return map;
  }, [transactions]);

  const grid = useMemo(() => {
    const year = monthAnchor.getFullYear();
    const month = monthAnchor.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: { date: Date; inMonth: boolean }[] = [];

    for (let i = 0; i < startOffset; i += 1) {
      const d = new Date(year, month, -startOffset + i + 1);
      cells.push({ date: d, inMonth: false });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({ date: new Date(year, month, day), inMonth: true });
    }
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date;
      cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false });
    }
    return cells;
  }, [monthAnchor]);

  return (
    <Card className="bg-surface-container-lowest p-4 overflow-hidden" glass={false}>
      <div className="grid grid-cols-7 gap-1 mb-2" role="row">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="text-center font-label-md font-bold text-on-surface-variant py-1" role="columnheader">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 auto-rows-fr min-h-[420px]" role="grid" aria-label="Transaction calendar">
        {grid.map(({ date, inMonth }) => {
          const key = ymdKey(date);
          const dayTxns = byDay.get(key) ?? [];
          const isToday = key === todayKey;
          const overflow = dayTxns.length - MAX_VISIBLE_EVENTS;
          const visible = expandedDayKey === key ? dayTxns : dayTxns.slice(0, MAX_VISIBLE_EVENTS);

          return (
            <div
              key={key}
              role="gridcell"
              tabIndex={0}
              className={`min-h-[88px] rounded-lg border p-1 flex flex-col gap-0.5 ${
                inMonth ? 'border-outline-variant/60 bg-surface-container-lowest' : 'border-transparent bg-surface-container/40 opacity-70'
              } ${isToday ? 'ring-2 ring-primary' : ''}`}
              onClick={() => onSelectDay?.(date, dayTxns)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectDay?.(date, dayTxns);
                }
              }}
            >
              <div className={`text-right font-label-md font-bold px-1 ${isToday ? 'text-primary' : 'text-on-surface-variant'}`}>
                {date.getDate()}
              </div>
              <div className="flex flex-col gap-0.5 overflow-hidden">
                {visible.map((txn) => (
                  <button
                    key={txn.id}
                    type="button"
                    className={`text-left truncate rounded px-1 py-0.5 text-[10px] font-semibold ${
                      txn.type === 'CREDIT'
                        ? 'bg-secondary-container/30 text-on-secondary-container'
                        : 'bg-error-container/25 text-error'
                    }`}
                    title={`${txn.title} — ${txn.amount}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTransaction?.(txn);
                    }}
                  >
                    {txn.title || txn.merchant || 'Transaction'}
                  </button>
                ))}
                {overflow > 0 && expandedDayKey !== key && (
                  <button
                    type="button"
                    className="text-[10px] font-bold text-primary text-left px-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedDayKey(key);
                    }}
                  >
                    +{overflow} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
