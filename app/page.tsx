import { LandingPage } from '@/components/marketing/LandingPage';
import { BRAND_DESCRIPTION, BRAND_NAME } from '@/lib/brand/constants';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `${BRAND_NAME} — Smart expense tracking for you and your groups`,
  description: BRAND_DESCRIPTION,
};

export default function HomePage() {
  return <LandingPage />;
}
