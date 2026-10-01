'use client';

import Link from 'next/link';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { SITE_DOCUMENT_FOOTER_LINKS } from '@/lib/marketing/siteDocuments';
import { useAuth } from '@/components/auth/AuthContext';

type MarketingDocumentShellProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function MarketingDocumentShell({ title, description, children }: MarketingDocumentShellProps) {
  const { user, isLoading } = useAuth();
  const isAuthenticated = !isLoading && !!user;
  const dashboardHref = user?.role === 'ADMIN' ? '/admin' : '/customer';

  return (
    <div className="min-h-screen bg-background text-on-background">
      <header className="border-b border-outline-variant/40 px-lg py-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link href="/">
            <BrandLogo variant="full" theme="mono" size="sm" />
          </Link>
          <Link
            href={isAuthenticated ? dashboardHref : '/auth/login'}
            className="text-sm font-semibold text-primary"
          >
            {isAuthenticated ? 'Dashboard' : 'Sign in'}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-lg py-2xl">
        <p className="font-label-md text-label-md font-bold uppercase tracking-widest text-on-surface-variant">
          Placeholder — replace before launch
        </p>
        <h1 className="mt-sm font-headline-md text-headline-md font-black text-primary">{title}</h1>
        {description ? (
          <p className="mt-md font-body-lg text-body-lg text-on-surface-variant">{description}</p>
        ) : null}
        <div className="prose-nexpo mt-xl space-y-lg font-body-md text-body-md text-on-surface leading-relaxed">
          {children}
        </div>
      </main>

      <footer className="border-t border-outline-variant/40 bg-surface-container-low px-lg py-xl">
        <div className="mx-auto flex max-w-3xl flex-col gap-md sm:flex-row sm:flex-wrap sm:gap-x-lg sm:gap-y-sm">
          {SITE_DOCUMENT_FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-primary hover:underline">
              {link.label}
            </Link>
          ))}
          <Link href="/" className="text-sm font-medium text-on-surface-variant hover:text-primary">
            Home
          </Link>
        </div>
      </footer>
    </div>
  );
}
