import { LandingPage } from '@/components/marketing/LandingPage';
import { BRAND_DESCRIPTION, BRAND_NAME } from '@/lib/brand/constants';
import { getBrandOgImagePath } from '@/lib/brand/logos';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `${BRAND_NAME} — Smart expense tracking for you and your groups`,
  description: BRAND_DESCRIPTION,
  openGraph: {
    title: `${BRAND_NAME} — Smart expense tracking for you and your groups`,
    description: BRAND_DESCRIPTION,
    images: [{ url: getBrandOgImagePath(), width: 1200, height: 630, alt: BRAND_NAME }],
  },
};

export default function HomePage() {
  return <LandingPage />;
}
