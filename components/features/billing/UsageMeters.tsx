'use client';

import React from 'react';
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
  if (!plan?.limits || plan.isPaid || plan.writesLocked) return null;

  const { usage, limits } = plan;

  return (
    <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-4 flex flex-col gap-3">
      <p className="text-sm font-semibold text-on-surface">Trial usage</p>
      <MeterRow label="Transactions" used={usage.personalTransactions} limit={limits.personalTransactions} />
      <MeterRow label="Receipt scans" used={usage.ocr} limit={limits.ocr} />
      <MeterRow label="Groups" used={usage.groups} limit={limits.groups} />
      <MeterRow label="Reminders" used={usage.activeReminders} limit={limits.activeReminders} />
      <MeterRow label="Finlit messages" used={usage.aiMessages} limit={limits.aiMessages} />
      {plan.trialDaysLeft > 0 && (
        <p className="text-xs text-on-surface-variant">
          {plan.trialDaysLeft} day{plan.trialDaysLeft === 1 ? '' : 's'} left in your Freemium trial.
        </p>
      )}
    </div>
  );
}
