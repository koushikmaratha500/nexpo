import { LegalPage } from '@/components/marketing/LegalPage';
import { TERMS_CONDITIONS } from '@/components/marketing/content';

export const metadata = { title: 'Terms & Conditions — PaysaSuchan' };

export default function Page() {
  return <LegalPage title="Terms & Conditions" intro="The rules for having an account and paying for PaysaSuchan." sections={TERMS_CONDITIONS} />;
}
