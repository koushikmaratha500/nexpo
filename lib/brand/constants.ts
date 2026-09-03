export const BRAND_NAME = 'PaysaSuchan';
export const BRAND_TAGLINE = 'Smart expense tracking for you and your groups';
export const BRAND_SUBTITLE = 'Personal & Group Ledger';
export const BRAND_DESCRIPTION =
  'Track personal and group expenses, split bills fairly, and share receipts — powered by AI when you need it.';

export { getBrandEmailLogoUrl, getBrandLogoAssetPath } from '@/lib/brand/logos';

export function getPublicAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}
