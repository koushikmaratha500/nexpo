import type { ReactNode } from 'react';
import { MarketingShell } from '@/components/marketing/SiteChrome';

const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://paysasuchan.com';

export const metadata = {
  metadataBase: new URL(base),
  openGraph: {
    title: 'PaysaSuchan',
    description: 'Track money, split bills fairly, never miss a due date.',
    siteName: 'PaysaSuchan',
    type: 'website' as const,
  },
  twitter: { card: 'summary_large_image' as const },
  title: 'PaysaSuchan — Track money, split bills, stay on top of dues',
  description:
    'Personal ledger, fair group expense splitting, payment reminders and an AI finance assistant in one app.',
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <MarketingShell>{children}</MarketingShell>;
}
