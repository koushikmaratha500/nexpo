'use client';

import React, { useState } from 'react';
import type { PlanEntitlement } from '@/lib/billing/types';

function MeterRow({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const nearLimit = pct >= 80;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-on-surface">{label}</span>
        <span className={nearLimit ? 'text-error font-semibold' : 'text-on-surface-variant'}>
          {used} / {limit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${nearLimit ? 'bg-error' : 'bg-primary'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function UsageMeters({ plan }: { plan: PlanEntitlement | null | undefined }) {
  const [open, setOpen] = useState(false);

  if (!plan?.limits || plan.isPaid || plan.writesLocked || plan.pricingEnabled === false) return null;

  const { usage, limits } = plan;
  const trialLabel =
    plan.trialDaysLeft > 0
      ? `${plan.trialDaysLeft} day${plan.trialDaysLeft === 1 ? '' : 's'} left in your Freemium trial`
      : 'Freemium trial limits';

  return (
    <div className="border border-outline-variant/60 rounded-xl overflow-hidden bg-surface-container-lowest">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-surface-container/30 transition-colors"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-on-surface">Trial usage</p>
          <p className="text-xs text-on-surface-variant mt-0.5 truncate">{trialLabel}</p>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant shrink-0 transition-transform duration-200">
          {open ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-outline-variant/20 pt-3 animate-slideDown">
          <MeterRow label="Transactions" used={usage.personalTransactions} limit={limits.personalTransactions} />
          <MeterRow label="Receipt scans" used={usage.ocr} limit={limits.ocr} />
          <MeterRow label="Groups" used={usage.groups} limit={limits.groups} />
          <MeterRow label="Reminders" used={usage.activeReminders} limit={limits.activeReminders} />
          <MeterRow label="Finlit messages" used={usage.aiMessages} limit={limits.aiMessages} />
        </div>
      )}
    </div>
  );
}
