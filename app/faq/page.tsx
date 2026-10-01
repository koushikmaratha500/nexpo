import type { Metadata } from 'next';
import { MarketingDocumentShell } from '@/components/marketing/MarketingDocumentShell';
import { FaqAccordion } from '@/components/marketing/FaqAccordion';
import { BRAND_NAME } from '@/lib/brand/constants';
import { MARKETING_FAQ_ITEMS } from '@/lib/marketing/faqContent';

export const metadata: Metadata = {
  title: `FAQ — ${BRAND_NAME}`,
  description: `Frequently asked questions about ${BRAND_NAME}.`,
};

export default function FaqPage() {
  return (
    <MarketingDocumentShell
      title="Frequently Asked Questions"
      description="Quick answers while we finalize help center content."
    >
      <FaqAccordion items={MARKETING_FAQ_ITEMS} defaultOpenIndex={0} />
    </MarketingDocumentShell>
  );
}
