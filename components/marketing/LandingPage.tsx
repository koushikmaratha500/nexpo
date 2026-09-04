'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { Button } from '@/components/ui/Button';
import { BRAND_DESCRIPTION, BRAND_NAME, BRAND_TAGLINE } from '@/lib/brand/constants';
import { useAuth } from '@/components/auth/AuthContext';

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#partners', label: 'Partners' },
  { href: '#experience', label: 'Experience' },
] as const;

const FEATURES = [
  {
    icon: 'receipt_long',
    title: 'Personal ledger',
    description: 'Track debits, credits, and recurring bills in one clean dashboard with categories and reports.',
    imageSide: 'right' as const,
  },
  {
    icon: 'groups',
    title: 'Group splits made fair',
    description: 'Split expenses equally or by custom amounts. See who owes what and export settlement summaries.',
    imageSide: 'left' as const,
  },
  {
    icon: 'smart_toy',
    title: 'AI receipt scan',
    description: 'Snap a photo and let AI extract merchant, amount, and date — then review before saving.',
    imageSide: 'right' as const,
  },
];

const EXPERIENCE_CARDS = [
  { icon: 'account_balance_wallet', title: 'My Products', text: 'Personal and group ledgers in one app.' },
  { icon: 'pin_drop', title: 'Smart reminders', text: 'Never miss a due date with in-app and push alerts.' },
  { icon: 'share', title: 'Share receipts', text: 'Send a public receipt link via WhatsApp or SMS.' },
];

const PARTNERS = ['Acme Corp', 'NovaPay', 'SplitWise+', 'LedgerOne', 'FinTrack'];

export function LandingPage() {
  const { user, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthenticated = !isLoading && !!user;
  const dashboardHref = user?.role === 'ADMIN' ? '/admin' : '/customer';
  const primaryCtaHref = isAuthenticated ? dashboardHref : '/auth/register';
  const primaryCtaLabel = isAuthenticated ? 'Go to Dashboard' : 'Get Started Free';

  return (
    <div className="min-h-screen bg-background text-on-background">
      <header className="sticky top-0 z-50 border-b border-outline-variant/40 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-lg py-md">
          <Link href="/" className="shrink-0">
            <BrandLogo variant="full" theme="mono" size="sm" />
          </Link>

          <nav className="hidden items-center gap-xl md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="font-body-md text-body-md font-medium text-on-surface-variant transition-colors hover:text-primary"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-sm md:flex">
            {!isAuthenticated ? (
              <Link href="/auth/login">
                <Button
                  variant="secondary"
                  className="rounded-full px-lg"
                  trackId="marketing_header_sign_in"
                  trackLabel="Sign In"
                  trackSection="marketing_header"
                >
                  Sign In
                </Button>
              </Link>
            ) : null}
            <Link href={primaryCtaHref}>
              <Button
                className="rounded-full px-lg bg-brand-gradient border-0 shadow-lg shadow-primary/25"
                trackId={isAuthenticated ? 'marketing_header_go_dashboard' : 'marketing_header_get_started'}
                trackLabel={primaryCtaLabel}
                trackSection="marketing_header"
              >
                {primaryCtaLabel}
              </Button>
            </Link>
          </div>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined">{mobileOpen ? 'close' : 'menu'}</span>
          </button>
        </div>

        {mobileOpen ? (
          <div className="border-t border-outline-variant/40 px-lg py-md md:hidden">
            <nav className="flex flex-col gap-sm">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-sm py-sm font-body-md text-on-surface-variant hover:bg-surface-container"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              {!isAuthenticated ? (
                <Link href="/auth/login" className="mt-sm" onClick={() => setMobileOpen(false)}>
                  <Button variant="secondary" className="w-full rounded-full">
                    Sign In
                  </Button>
                </Link>
              ) : null}
              <Link href={primaryCtaHref} onClick={() => setMobileOpen(false)}>
                <Button className="mt-sm w-full rounded-full bg-brand-gradient border-0">{primaryCtaLabel}</Button>
              </Link>
            </nav>
          </div>
        ) : null}
      </header>

      <section className="relative overflow-hidden bg-brand-gradient px-lg py-3xl text-on-primary">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent-gold/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-2xl lg:grid-cols-2">
          <div>
            <p className="mb-sm inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-md py-xs font-label-md text-label-md font-bold uppercase tracking-widest">
              <span className="material-symbols-outlined text-sm text-accent-gold">auto_awesome</span>
              Now launching as {BRAND_NAME}
            </p>
            <h1 className="font-headline-lg text-headline-lg font-black tracking-tight lg:text-[3rem] lg:leading-[1.1]">
              Track smarter.
              <br />
              Split fairly.
              <br />
              Share instantly.
            </h1>
            <p className="mt-lg max-w-lg font-body-lg text-body-lg text-white/85">{BRAND_TAGLINE}</p>

            <div className="mt-xl flex flex-wrap items-center gap-md">
              <Link href={primaryCtaHref}>
                <Button
                  className="rounded-full bg-surface-dark px-xl py-md text-on-primary shadow-xl"
                  trackId={isAuthenticated ? 'marketing_hero_go_dashboard' : 'marketing_hero_get_started'}
                  trackLabel={primaryCtaLabel}
                  trackSection="marketing_hero"
                >
                  {primaryCtaLabel}
                </Button>
              </Link>
              {!isAuthenticated ? (
                <Link href="/auth/login">
                  <Button
                    variant="secondary"
                    className="rounded-full border-white/30 bg-white/10 text-white hover:bg-white/20"
                    trackId="marketing_hero_sign_in"
                    trackLabel="Sign In"
                    trackSection="marketing_hero"
                  >
                    Sign In
                  </Button>
                </Link>
              ) : null}
            </div>

            <div className="mt-xl flex flex-wrap items-center gap-lg opacity-90">
              <div className="flex h-12 items-center rounded-xl border border-white/20 bg-white/10 px-md font-label-md text-label-md">
                App Store — Soon
              </div>
              <div className="flex h-12 items-center rounded-xl border border-white/20 bg-white/10 px-md font-label-md text-label-md">
                Google Play — Soon
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="rounded-[2.5rem] border-[10px] border-surface-dark bg-surface-dark p-2 shadow-2xl">
              <div className="overflow-hidden rounded-[1.75rem] bg-surface-container-lowest">
                <div className="bg-brand-gradient px-md py-lg text-center">
                  <BrandLogo variant="full" theme="light" size="sm" className="justify-center" />
                </div>
                <div className="space-y-sm p-md">
                  {['Groceries', 'Rent split', 'Coffee run'].map((label, i) => (
                    <div key={label} className="flex items-center justify-between rounded-xl bg-primary-light px-md py-sm">
                      <span className="font-body-md text-body-md font-medium text-on-surface">{label}</span>
                      <span className="font-mono-data text-mono-data font-bold text-primary">
                        {i === 0 ? '₹1,240' : i === 1 ? '₹8,500' : '₹320'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -right-4 top-8 hidden rounded-2xl border border-outline-variant bg-surface-container-lowest p-md shadow-xl lg:block">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-accent-gold">monetization_on</span>
                <div>
                  <p className="font-label-md text-label-md text-on-surface-variant">Rewards</p>
                  <p className="font-title-md text-title-md font-bold text-primary">Fair splits</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="px-lg py-3xl">
        <div className="mx-auto max-w-6xl">
          {FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              className={`mb-3xl grid items-center gap-2xl lg:grid-cols-2 ${
                feature.imageSide === 'left' ? 'lg:[&>div:first-child]:order-2' : ''
              }`}
            >
              <div>
                <span className="material-symbols-outlined mb-md inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light text-primary">
                  {feature.icon}
                </span>
                <h2 className="font-headline-md text-headline-md font-black text-primary">{feature.title}</h2>
                <p className="mt-md font-body-lg text-body-lg text-on-surface-variant">{feature.description}</p>
              </div>
              <div
                className={`rounded-2xl p-2xl ${
                  index % 2 === 0 ? 'bg-primary-light' : 'bg-surface-container border border-outline-variant/50'
                }`}
              >
                <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-xl bg-surface-container-lowest p-xl shadow-sm">
                  <span className="material-symbols-outlined text-5xl text-primary/40">{feature.icon}</span>
                  <p className="mt-md text-center font-label-md text-label-md font-bold uppercase tracking-widest text-on-surface-variant">
                    Feature preview
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="partners" className="border-y border-outline-variant/40 bg-surface-container-low px-lg py-2xl">
        <div className="mx-auto max-w-6xl text-center">
          <p className="font-label-md text-label-md font-bold uppercase tracking-widest text-on-surface-variant">
            Trusted by teams
          </p>
          <div className="mt-lg flex flex-wrap items-center justify-center gap-xl opacity-60 grayscale">
            {PARTNERS.map((name) => (
              <span key={name} className="font-headline-sm text-headline-sm font-black text-on-surface-variant">
                {name}
              </span>
            ))}
          </div>
          <blockquote className="mx-auto mt-2xl max-w-2xl rounded-2xl border border-outline-variant bg-surface-container-lowest p-xl shadow-sm">
            <p className="font-body-lg text-body-lg text-on-surface">
              &ldquo;{BRAND_NAME} finally made group expenses painless. We split rent, utilities, and trips without
              awkward spreadsheets.&rdquo;
            </p>
            <footer className="mt-md font-title-md text-title-md font-bold text-primary">— Early beta user</footer>
          </blockquote>
        </div>
      </section>

      <section id="experience" className="px-lg py-3xl">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="font-headline-md text-headline-md font-black text-primary">Elevate your experience</h2>
          <p className="mx-auto mt-md max-w-xl font-body-lg text-body-lg text-on-surface-variant">{BRAND_DESCRIPTION}</p>
          <div className="mt-2xl grid gap-lg md:grid-cols-3">
            {EXPERIENCE_CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-outline-variant/50 bg-primary-light p-xl text-left shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="material-symbols-outlined mb-md text-3xl text-primary">{card.icon}</span>
                <h3 className="font-title-md text-title-md font-bold text-primary">{card.title}</h3>
                <p className="mt-sm font-body-md text-body-md text-on-surface-variant">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-gradient px-lg py-3xl text-center text-on-primary">
        <h2 className="font-headline-md text-headline-md font-black">Ready to simplify your finances?</h2>
        <p className="mx-auto mt-md max-w-lg font-body-lg text-body-lg text-white/85">
          Join {BRAND_NAME} — personal tracking, group splits, and shareable receipts in one place.
        </p>
        <Link href={primaryCtaHref} className="mt-xl inline-block">
          <Button
            className="rounded-full bg-surface-dark px-2xl py-md text-on-primary shadow-xl"
            trackId={isAuthenticated ? 'marketing_footer_go_dashboard' : 'marketing_footer_get_started'}
            trackLabel={primaryCtaLabel}
            trackSection="marketing_footer_cta"
          >
            {primaryCtaLabel}
          </Button>
        </Link>
      </section>

      <footer className="bg-surface-dark px-lg py-2xl text-white/80">
        <div className="mx-auto grid max-w-6xl gap-2xl md:grid-cols-4">
          <div className="md:col-span-2">
            <BrandLogo variant="full" theme="light" size="sm" />
            <p className="mt-md max-w-sm font-body-md text-body-md text-white/60">{BRAND_DESCRIPTION}</p>
            <p className="mt-lg font-label-md text-label-md text-white/40">
              © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
            </p>
          </div>
          <div>
            <p className="font-label-md text-label-md font-bold uppercase tracking-widest text-white/50">Product</p>
            <ul className="mt-md space-y-sm font-body-md text-body-md">
              <li>
                <a href="#features" className="hover:text-white">
                  Features
                </a>
              </li>
              {isAuthenticated ? (
                <li>
                  <Link href={dashboardHref} className="hover:text-white">
                    Dashboard
                  </Link>
                </li>
              ) : (
                <>
                  <li>
                    <Link href="/auth/register" className="hover:text-white">
                      Register
                    </Link>
                  </li>
                  <li>
                    <Link href="/auth/login" className="hover:text-white">
                      Sign In
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
          <div>
            <p className="font-label-md text-label-md font-bold uppercase tracking-widest text-white/50">Company</p>
            <ul className="mt-md space-y-sm font-body-md text-body-md">
              <li>
                <Link href="/customer/support" className="hover:text-white">
                  Support
                </Link>
              </li>
              <li>
                <a href="#partners" className="hover:text-white">
                  Partners
                </a>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-white">
                  Admin
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
