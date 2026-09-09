'use client';

import React from 'react';
import { usePlan } from './PlanProvider';
import { UsageMeters } from './UsageMeters';

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export function PlanBanner() {
  const { plan, setUpgradeOpen } = usePlan();
  if (!plan) return null;

  if (plan.writesLocked) {
    const isStarterLapsed = plan.plan === 'STARTER' || plan.status === 'EXPIRED';
    return (
      <div className="mb-6 rounded-xl border border-error/30 bg-error-container/15 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <p className="text-sm text-on-surface">
          {isStarterLapsed
            ? 'Your subscription has ended. You can still view your data. Renew Starter or upgrade to Pro to edit again.'
            : 'Your 7-day trial has ended. You can still view your data. Upgrade to Starter or Pro to add or edit.'}
        </p>
        <button
          type="button"
          onClick={() => setUpgradeOpen(true)}
          className="shrink-0 px-4 h-10 rounded-lg bg-primary text-on-primary text-sm font-semibold"
        >
          View plans
        </button>
      </div>
    );
  }

  if (plan.status === 'PAST_DUE') {
    return (
      <div className="mb-6 rounded-xl border border-error/30 bg-error-container/15 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <p className="text-sm text-on-surface">
          Your last Starter payment failed. Update billing in Settings before your period ends.
        </p>
        <button
          type="button"
          onClick={() => setUpgradeOpen(true)}
          className="shrink-0 px-4 h-10 rounded-lg bg-primary text-on-primary text-sm font-semibold"
        >
          Renew
        </button>
      </div>
    );
  }

  if (plan.plan === 'STARTER' && plan.status === 'CANCELED') {
    const left = daysUntil(plan.currentPeriodEndsAt);
    return (
      <div className="mb-6 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <p className="text-sm text-on-surface">
          Starter canceled{left !== null ? ` — ${left} day${left === 1 ? '' : 's'} of access left` : ''}.
        </p>
        <button
          type="button"
          onClick={() => setUpgradeOpen(true)}
          className="shrink-0 px-4 h-10 rounded-lg border border-outline text-sm font-semibold"
        >
          Resubscribe
        </button>
      </div>
    );
  }

  if (plan.status === 'TRIALING' && plan.trialDaysLeft > 0) {
    return (
      <div className="mb-6 flex flex-col gap-3">
        <div className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <p className="text-sm text-on-surface">
            Freemium trial: <strong>{plan.trialDaysLeft}</strong> day{plan.trialDaysLeft === 1 ? '' : 's'} left.
            Starter is ₹100/month or ₹1,000/year. Pro is ₹10,000 lifetime.
          </p>
          <button
            type="button"
            onClick={() => setUpgradeOpen(true)}
            className="shrink-0 px-4 h-10 rounded-lg border border-outline text-sm font-semibold"
          >
            Compare plans
          </button>
        </div>
        <UsageMeters plan={plan} />
      </div>
    );
  }

  return null;
}
