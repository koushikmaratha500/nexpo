'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import type { TransactionDisplayMode } from '@/hooks/useTransactionBrowse';
import type { ResolvedPeriodRange, TransactionPeriodMode } from '@/lib/transactions/period-range';

const PERIOD_OPTIONS: { id: TransactionPeriodMode; label: string }[] = [
  { id: 'day', label: 'Day' },
  { id: 'month', label: 'Month' },
  { id: 'ytd', label: 'Year to Date' },
];

const VIEW_OPTIONS: { id: TransactionDisplayMode; label: string; icon: string }[] = [
  { id: 'table', label: 'Table', icon: 'table_rows' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar_month' },
];

export interface TransactionBrowseToolbarProps {
  periodMode: TransactionPeriodMode;
  onPeriodChange: (mode: TransactionPeriodMode) => void;
  displayMode: TransactionDisplayMode;
  onDisplayModeChange: (mode: TransactionDisplayMode) => void;
  periodRange: ResolvedPeriodRange;
  onNavigate: (direction: -1 | 1) => void;
  canNavigateForward?: boolean;
}

export function TransactionBrowseToolbar({
  periodMode,
  onPeriodChange,
  displayMode,
  onDisplayModeChange,
  periodRange,
  onNavigate,
  canNavigateForward = periodMode !== 'ytd',
}: TransactionBrowseToolbarProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div
          className="inline-flex rounded-xl border border-outline-variant bg-surface-container-low p-1"
          role="tablist"
          aria-label="Date range"
        >
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={periodMode === opt.id}
              className={`px-4 py-2 rounded-lg font-label-md font-bold transition-colors ${
                periodMode === opt.id
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
              onClick={() => onPeriodChange(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div
          className="inline-flex rounded-xl border border-outline-variant bg-surface-container-low p-1 self-start"
          role="tablist"
          aria-label="Display mode"
        >
          {VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={displayMode === opt.id}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-label-md font-bold transition-colors ${
                displayMode === opt.id
                  ? 'bg-secondary-container text-on-secondary-container shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
              onClick={() => onDisplayModeChange(opt.id)}
            >
              <span className="material-symbols-outlined text-base">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            className="px-2 py-2"
            aria-label="Previous period"
            onClick={() => onNavigate(-1)}
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </Button>
          <p className="font-title-md text-title-md font-bold text-primary min-w-[12rem] text-center">
            {periodRange.label}
          </p>
          <Button
            type="button"
            variant="secondary"
            className="px-2 py-2"
            aria-label="Next period"
            disabled={!canNavigateForward}
            onClick={() => onNavigate(1)}
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
