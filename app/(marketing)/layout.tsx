import type { ReactNode } from 'react';
import { MarketingShell } from '@/components/marketing/SiteChrome';

export const metadata = {
  title: 'PaysaSuchan — Track money, split bills, stay on top of dues',
  description:
    'Personal ledger, fair group expense splitting, payment reminders and an AI finance assistant in one app.',
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <MarketingShell>{children}</MarketingShell>;
}
