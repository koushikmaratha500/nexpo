import { LegalPage } from '@/components/marketing/LegalPage';
import { REFUND_POLICY } from '@/components/marketing/content';

export const metadata = { title: 'Refund & Cancellation Policy — PaysaSuchan' };

export default function Page() {
  return (
    <LegalPage
      title="Refund & Cancellation Policy"
      intro="How cancelling a subscription and getting a refund work for paid PaysaSuchan plans."
      sections={REFUND_POLICY}
    />
  );
}
