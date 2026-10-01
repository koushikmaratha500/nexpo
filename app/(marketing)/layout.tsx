import type { ReactNode } from 'react';
import { Figtree } from 'next/font/google';
import './marketing.css';
import { Nav, Footer } from '@/components/marketing/SiteChrome';

const figtree = Figtree({ subsets: ['latin'], display: 'swap' });

export const metadata = {
  title: 'PaysaSuchan — Track money, split bills, stay on top of dues',
  description:
    'Personal ledger, fair group expense splitting, payment reminders and an AI finance assistant in one app.',
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${figtree.className} ps:min-h-screen ps:bg-paper ps:text-ink ps:antialiased`}>
      <Nav />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
