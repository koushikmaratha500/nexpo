'use client';

import React, { useCallback, useState } from 'react';
import axios from 'axios';
import { usePathname, useSearchParams } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { trackBilling } from '@/lib/analytics/track';
import { formatInr, PLAN_PRICES_INR } from '@/lib/billing/catalog';
import { DEFAULT_CATALOG, usePlan } from './PlanProvider';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/components/auth/AuthContext';

type CheckoutSku = 'STARTER_MONTHLY' | 'STARTER_YEARLY' | 'PRO_LIFETIME';

interface RazorpayClientPayload {
  kind: 'razorpay';
  keyId: string;
  orderId?: string;
  subscriptionId?: string;
  amountPaise: number;
  currency: string;
  name: string;
  description: string;
  prefill: { email: string; name: string };
  notes: Record<string, string>;
}

interface StripeClientPayload {
  kind: 'stripe';
  sessionId: string;
  url: string;
}

interface CheckoutResponse {
  sessionId: string;
  provider: string;
  sku: CheckoutSku;
  subtotalPaise: number;
  gstPaise: number;
  totalPaise: number;
  client: RazorpayClientPayload | StripeClientPayload;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay'));
    document.body.appendChild(script);
  });
}

export function UpgradeWall() {
  const { plan, upgradeOpen, setUpgradeOpen, refresh } = usePlan();
  const { addToast } = useToast();
  const { user } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loadingSku, setLoadingSku] = useState<CheckoutSku | null>(null);
  const pageSearch = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const catalog = plan?.catalog ?? DEFAULT_CATALOG;
  const prices = catalog.pricesInr ?? PLAN_PRICES_INR;
  const checkoutAvailable = catalog.checkoutAvailable ?? false;

  const startCheckout = useCallback(
    async (sku: CheckoutSku) => {
      setLoadingSku(sku);
      trackBilling(pathname, pageSearch, { action: 'checkout_start', sku, plan: plan?.plan }, user?.role);
      try {
        const response = await axios.post<CheckoutResponse>('/api/user/billing/checkout', { sku });
        const data = response.data;
        const client = data.client;

        if (client.kind === 'stripe') {
          trackBilling(
            pathname,
            pageSearch,
            { action: 'checkout_start', sku, provider: 'stripe', plan: plan?.plan },
            user?.role,
          );
          window.location.href = client.url;
          return;
        }

        await loadRazorpayScript();
        if (!window.Razorpay) {
          throw new Error('Razorpay unavailable');
        }

        const rzp = new window.Razorpay({
          key: client.keyId,
          amount: client.amountPaise,
          currency: client.currency,
          name: client.name,
          description: client.description,
          order_id: client.orderId,
          subscription_id: client.subscriptionId,
          prefill: client.prefill,
          notes: client.notes,
          handler: async (paymentResponse: {
            razorpay_payment_id: string;
            razorpay_order_id?: string;
            razorpay_subscription_id?: string;
            razorpay_signature: string;
          }) => {
            try {
              await axios.post('/api/user/billing/verify', {
                checkoutSessionId: data.sessionId,
                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                razorpayOrderId: paymentResponse.razorpay_order_id,
                razorpaySubscriptionId: paymentResponse.razorpay_subscription_id,
                razorpaySignature: paymentResponse.razorpay_signature,
              });
              trackBilling(
                pathname,
                pageSearch,
                { action: 'checkout_success', sku, provider: 'razorpay', plan: plan?.plan },
                user?.role,
              );
              addToast('Payment successful. Your plan is now active.', 'success');
              setUpgradeOpen(false);
              await refresh();
            } catch (err: unknown) {
              const msg =
                axios.isAxiosError(err) && err.response?.data?.error
                  ? String(err.response.data.error)
                  : 'Payment verification failed';
              addToast(msg, 'error');
            }
          },
          modal: {
            ondismiss: () => setLoadingSku(null),
          },
        });
        rzp.open();
      } catch (err: unknown) {
        const msg =
          axios.isAxiosError(err) && err.response?.data?.error
            ? String(err.response.data.error)
            : 'Could not start checkout';
        addToast(msg, 'error');
      } finally {
        setLoadingSku(null);
      }
    },
    [addToast, pageSearch, pathname, plan?.plan, refresh, setUpgradeOpen, user?.role],
  );

  const gstNote = checkoutAvailable
    ? '+ 18% GST at checkout'
    : 'Configure Razorpay or Stripe keys to enable checkout';

  const isPro = plan?.plan === 'PRO';
  const isStarterActive = plan?.plan === 'STARTER' && plan.isPaid;

  if (plan?.pricingEnabled === false) return null;

  return (
    <Modal
      isOpen={upgradeOpen}
      onClose={() => setUpgradeOpen(false)}
      title={isStarterActive ? 'Upgrade to Pro' : 'Choose a plan'}
      maxWidth="max-w-[720px]"
    >
      <div className="p-lg flex flex-col gap-lg">
        <p className="text-sm text-on-surface-variant">
          {isPro
            ? 'You already have Pro lifetime access.'
            : checkoutAvailable
              ? isStarterActive
                ? `Upgrade to Pro lifetime. Your active Starter subscription will be canceled when Pro is purchased. Prices exclude GST (${gstNote}).`
                : `Pay with ${catalog.activeCheckoutProvider ?? 'razorpay'}. Prices are exclusive of GST (${gstNote}).`
              : 'Checkout is not configured yet. Ask an admin to set payment keys and choose a provider in System Settings.'}
        </p>
        <div className={`grid grid-cols-1 gap-md ${isStarterActive ? '' : 'md:grid-cols-2'}`}>
          {!isStarterActive && (
          <div className="rounded-xl border border-outline-variant p-md flex flex-col gap-sm">
            <h3 className="font-headline-sm font-black">Starter</h3>
            <p className="text-2xl font-black text-primary">
              {formatInr(prices.starterMonthly)}
              <span className="text-sm font-medium"> / month</span>
            </p>
            <p className="text-sm text-on-surface-variant">{formatInr(prices.starterYearly)} / year</p>
            <ul className="text-sm text-on-surface list-disc pl-4 space-y-1 flex-1">
              <li>Unlimited transactions, groups, reminders, OCR</li>
              <li>Finlit AI included</li>
              <li>CSV export</li>
            </ul>
            <div className="flex flex-col gap-2 mt-2">
              <Button
                type="button"
                disabled={!checkoutAvailable || loadingSku !== null}
                onClick={() => startCheckout('STARTER_MONTHLY')}
              >
                {loadingSku === 'STARTER_MONTHLY' ? 'Starting…' : `Monthly · ${formatInr(prices.starterMonthly)}`}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={!checkoutAvailable || loadingSku !== null}
                onClick={() => startCheckout('STARTER_YEARLY')}
              >
                {loadingSku === 'STARTER_YEARLY' ? 'Starting…' : `Yearly · ${formatInr(prices.starterYearly)}`}
              </Button>
            </div>
          </div>
          )}
          <div className="rounded-xl border border-primary/40 bg-primary-container/10 p-md flex flex-col gap-sm">
            <h3 className="font-headline-sm font-black">Pro</h3>
            <p className="text-2xl font-black text-primary">{formatInr(prices.proLifetime)}</p>
            <p className="text-sm text-on-surface-variant">One-time lifetime · {gstNote}</p>
            <ul className="text-sm text-on-surface list-disc pl-4 space-y-1 flex-1">
              <li>Everything in Starter</li>
              <li>Pay once — no renewals</li>
              <li>Priority support</li>
            </ul>
            <Button
              type="button"
              className="mt-2"
              disabled={!checkoutAvailable || loadingSku !== null || isPro}
              onClick={() => startCheckout('PRO_LIFETIME')}
            >
              {isPro
                ? 'Pro active'
                : loadingSku === 'PRO_LIFETIME'
                  ? 'Starting…'
                  : `Buy lifetime · ${formatInr(prices.proLifetime)}`}
            </Button>
          </div>
        </div>
        {checkoutAvailable && plan && (
          <p className="text-xs text-on-surface-variant text-center">
            Total with GST from {formatInr(Math.round(prices.starterMonthly * 1.18))} / month
          </p>
        )}
        <button
          type="button"
          className="h-11 rounded-lg bg-surface-container-high text-on-surface font-semibold"
          onClick={() => setUpgradeOpen(false)}
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
