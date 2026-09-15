'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { FREEMIUM_LIMITS, PLAN_PRICES_INR, TRIAL_DAYS, formatInr } from '@/lib/billing/catalog';

interface PricingSectionProps {
  primaryCtaHref: string;
  primaryCtaLabel: string;
  showFreemium?: boolean;
  id?: string;
}

export function PricingSection({
  primaryCtaHref,
  primaryCtaLabel,
  showFreemium = true,
  id = 'pricing',
}: PricingSectionProps) {
  return (
    <section id={id} className="bg-surface-container-low py-2xl">
      <div className="mx-auto max-w-6xl px-lg">
        <div className="text-center mb-xl">
          <h2 className="font-headline-lg text-headline-lg font-black text-primary">Simple, transparent pricing</h2>
          <p className="mt-sm text-on-surface-variant max-w-2xl mx-auto">
            Start with a {TRIAL_DAYS}-day Freemium trial — no card required. GST is added at checkout on paid plans.
          </p>
        </div>

        <div className={`grid grid-cols-1 gap-lg ${showFreemium ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
          {showFreemium && (
            <div className="rounded-2xl border border-outline-variant bg-background p-lg flex flex-col">
              <h3 className="font-headline-sm font-black">Freemium</h3>
              <p className="text-3xl font-black text-primary mt-2">₹0</p>
              <p className="text-sm text-on-surface-variant">{TRIAL_DAYS}-day trial · no payment method</p>
              <ul className="mt-md text-sm text-on-surface space-y-2 flex-1">
                <li>{FREEMIUM_LIMITS.personalTransactions} transactions</li>
                <li>{FREEMIUM_LIMITS.ocr} receipt scans</li>
                <li>{FREEMIUM_LIMITS.groups} groups · {FREEMIUM_LIMITS.membersPerGroup} members each</li>
                <li>{FREEMIUM_LIMITS.aiMessages} Finlit messages</li>
                <li>Full splits, reminders & sharing during trial</li>
              </ul>
              <Link href={primaryCtaHref} className="mt-lg">
                <Button type="button" variant="secondary" className="w-full">
                  {primaryCtaLabel}
                </Button>
              </Link>
            </div>
          )}

          <div className="rounded-2xl border border-outline-variant bg-background p-lg flex flex-col">
            <h3 className="font-headline-sm font-black">Starter</h3>
            <p className="text-3xl font-black text-primary mt-2">
              {formatInr(PLAN_PRICES_INR.starterMonthly)}
              <span className="text-base font-medium text-on-surface-variant"> / mo</span>
            </p>
            <p className="text-sm text-on-surface-variant">
              or {formatInr(PLAN_PRICES_INR.starterYearly)} / year
            </p>
            <ul className="mt-md text-sm text-on-surface space-y-2 flex-1">
              <li>Unlimited transactions, groups, OCR</li>
              <li>Finlit AI included</li>
              <li>CSV export & receipt sharing</li>
              <li>Email, push & in-app notifications</li>
            </ul>
            <Link href={primaryCtaHref} className="mt-lg">
              <Button type="button" className="w-full" trackId="marketing_pricing_starter">
                Get Starter
              </Button>
            </Link>
          </div>

          <div className="rounded-2xl border-2 border-primary/50 bg-primary-container/10 p-lg flex flex-col relative">
            <span className="absolute -top-3 right-4 rounded-full bg-accent-gold px-3 py-1 text-xs font-bold text-on-surface">
              Best value
            </span>
            <h3 className="font-headline-sm font-black">Pro</h3>
            <p className="text-3xl font-black text-primary mt-2">{formatInr(PLAN_PRICES_INR.proLifetime)}</p>
            <p className="text-sm text-on-surface-variant">One-time lifetime · pay once</p>
            <ul className="mt-md text-sm text-on-surface space-y-2 flex-1">
              <li>Everything in Starter</li>
              <li>No renewals — lifetime access</li>
              <li>Priority support</li>
            </ul>
            <Link href={primaryCtaHref} className="mt-lg">
              <Button type="button" className="w-full" trackId="marketing_pricing_pro">
                Buy Pro lifetime
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
