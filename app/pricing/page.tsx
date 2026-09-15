'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { PricingSection } from '@/components/marketing/PricingSection';
import { useAuth } from '@/components/auth/AuthContext';

export default function PricingPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [pricingEnabled, setPricingEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/public/config')
      .then((res) => res.json())
      .then((data: { pricingEnabled?: boolean }) => {
        const enabled = data.pricingEnabled !== false;
        setPricingEnabled(enabled);
        if (!enabled) {
          router.replace('/');
        }
      })
      .catch(() => setPricingEnabled(true));
  }, [router]);

  const isAuthenticated = !isLoading && !!user;
  const dashboardHref = user?.role === 'ADMIN' ? '/admin' : '/customer';
  const primaryCtaHref = isAuthenticated ? `${dashboardHref}/settings` : '/auth/register';
  const primaryCtaLabel = isAuthenticated ? 'Manage plan in Settings' : 'Start free trial';

  if (pricingEnabled === false || pricingEnabled === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-on-surface-variant">
        {pricingEnabled === null ? 'Loading…' : 'Redirecting…'}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-outline-variant/40 px-lg py-md">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Link href="/">
            <BrandLogo variant="full" theme="mono" size="sm" />
          </Link>
          <Link href={isAuthenticated ? dashboardHref : '/auth/login'} className="text-sm font-semibold text-primary">
            {isAuthenticated ? 'Dashboard' : 'Sign in'}
          </Link>
        </div>
      </header>
      <PricingSection
        primaryCtaHref={primaryCtaHref}
        primaryCtaLabel={primaryCtaLabel}
        showFreemium
      />
    </div>
  );
}
