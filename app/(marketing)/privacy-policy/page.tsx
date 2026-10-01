import { LegalPage } from '@/components/marketing/LegalPage';
import { PRIVACY } from '@/components/marketing/content';

export const metadata = { title: 'Privacy Policy — PaysaSuchan' };

export default function Page() {
  return <LegalPage title="Privacy Policy" intro="What we collect, why, who sees it, and the control you have." sections={PRIVACY} />;
}
