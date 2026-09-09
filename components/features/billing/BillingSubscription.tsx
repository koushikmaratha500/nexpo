'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { usePlan } from './PlanProvider';

interface SubscriptionSummary {
  plan: string;
  planStatus: string;
  billingInterval: string;
  currentPeriodEndsAt: string | null;
  paymentProvider: string | null;
  billingGstin: string | null;
  canCancel: boolean;
}

export function BillingSubscription() {
  const { addToast } = useToast();
  const { refresh, setUpgradeOpen } = usePlan();
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  const [gstin, setGstin] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    axios
      .get<SubscriptionSummary>('/api/user/billing/subscription')
      .then((res) => {
        setSummary(res.data);
        setGstin(res.data.billingGstin ?? '');
      })
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  const saveGstin = async () => {
    setSaving(true);
    try {
      const res = await axios.patch<{ billingGstin: string | null }>('/api/user/billing/profile', {
        billingGstin: gstin.trim() || null,
      });
      setGstin(res.data.billingGstin ?? '');
      addToast('Billing GSTIN saved', 'success');
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Failed to save GSTIN';
      addToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const cancelSubscription = async () => {
    if (!window.confirm('Cancel Starter at the end of this billing period?')) return;
    setCanceling(true);
    try {
      const res = await axios.post<{ effectiveUntil: string | null }>('/api/user/billing/cancel');
      addToast(
        res.data.effectiveUntil
          ? `Subscription canceled. Access continues until ${new Date(res.data.effectiveUntil).toLocaleDateString('en-IN')}.`
          : 'Subscription canceled.',
        'success',
      );
      const updated = await axios.get<SubscriptionSummary>('/api/user/billing/subscription');
      setSummary(updated.data);
      await refresh();
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Failed to cancel subscription';
      addToast(msg, 'error');
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-surface-container-lowest" glass={false}>
        <p className="text-sm text-on-surface-variant">Loading billing details…</p>
      </Card>
    );
  }

  if (!summary) return null;

  const periodEnd = summary.currentPeriodEndsAt
    ? new Date(summary.currentPeriodEndsAt).toLocaleDateString('en-IN')
    : null;

  return (
    <Card className="bg-surface-container-lowest flex flex-col gap-md" glass={false}>
      <div>
        <h3 className="font-title-md font-bold text-primary">Billing</h3>
        <p className="text-sm text-on-surface-variant mt-1">
          GSTIN for invoices (optional). Provider: {summary.paymentProvider ?? 'none'}.
        </p>
      </div>

      {summary.plan === 'STARTER' && (
        <div className="text-sm text-on-surface rounded-lg bg-surface-container-low px-3 py-2">
          <p>
            Starter · {summary.billingInterval === 'YEAR' ? 'yearly' : 'monthly'} ·{' '}
            <span className="font-semibold">{summary.planStatus}</span>
          </p>
          {periodEnd && <p>Current period ends {periodEnd}</p>}
          {summary.planStatus === 'PAST_DUE' && (
            <p className="text-error mt-1">Last payment failed. Renew to avoid losing edit access.</p>
          )}
          {summary.planStatus === 'CANCELED' && periodEnd && (
            <p className="mt-1">Canceled — access continues until {periodEnd}.</p>
          )}
        </div>
      )}

      {summary.plan === 'PRO' && (
        <p className="text-sm text-on-surface">Pro lifetime — no renewal required.</p>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase text-on-surface-variant">Your GSTIN</label>
        <input
          value={gstin}
          onChange={(e) => setGstin(e.target.value.toUpperCase())}
          placeholder="29AAAAA0000A1Z5"
          maxLength={15}
          className="h-11 px-3 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface"
        />
        <Button type="button" disabled={saving} onClick={saveGstin}>
          {saving ? 'Saving…' : 'Save GSTIN'}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {summary.plan !== 'PRO' && (
          <Button type="button" variant="secondary" onClick={() => setUpgradeOpen(true)}>
            Change plan
          </Button>
        )}
        {summary.canCancel && (
          <Button type="button" variant="secondary" disabled={canceling} onClick={cancelSubscription}>
            {canceling ? 'Canceling…' : 'Cancel subscription'}
          </Button>
        )}
      </div>
    </Card>
  );
}
