import { LegalPage } from '@/components/marketing/LegalPage';
import { TERMS_OF_USE } from '@/components/marketing/content';

export const metadata = { title: 'Terms of Use — PaysaSuchan' };

export default function Page() {
  return <LegalPage title="Terms of Use" intro="How you may and may not use the PaysaSuchan service." sections={TERMS_OF_USE} />;
}
