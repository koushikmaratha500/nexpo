import type { BrandLogoTheme, BrandLogoVariant } from '@/components/brand/BrandLogo';

export const BRAND_ASSET_BASE_PATH = '/brand';

function buildAssetFileName(variant: BrandLogoVariant, theme: BrandLogoTheme, ext: 'svg' | 'png'): string {
  return `logo-${variant}-${theme}.${ext}`;
}

export function getBrandLogoAssetPath(
  variant: BrandLogoVariant,
  theme: BrandLogoTheme,
  ext: 'svg' | 'png' = 'png',
): string {
  if (variant === 'full' && ext === 'png') {
    return `${BRAND_ASSET_BASE_PATH}/logo-full-${theme}@2x.png`;
  }
  return `${BRAND_ASSET_BASE_PATH}/${buildAssetFileName(variant, theme, ext)}`;
}

export function getBrandLogoSrcSet(variant: BrandLogoVariant, theme: BrandLogoTheme): string | undefined {
  if (variant !== 'full') return undefined;
  const base = `${BRAND_ASSET_BASE_PATH}/logo-full-${theme}`;
  return `${base}@1x.png 1x, ${base}@2x.png 2x, ${base}@3x.png 3x`;
}

export function getBrandEmailLogoUrl(): string {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${appUrl}${BRAND_ASSET_BASE_PATH}/email-header-560x160.png`;
}

export function getBrandOgImagePath(): string {
  return `${BRAND_ASSET_BASE_PATH}/og-image.png`;
}

export function getBrandPublicReceiptLogoPath(): string {
  return `${BRAND_ASSET_BASE_PATH}/public-receipt-logo-720x192.png`;
}

export const BRAND_LOGO_DIMENSIONS = {
  full: { width: 1080, height: 288, aspect: 1080 / 288 },
  icon: { width: 1024, height: 1024, aspect: 1 },
  wordmark: { width: 900, height: 220, aspect: 900 / 220 },
} as const;

export function getBrandLogoDisplaySize(
  variant: BrandLogoVariant,
  size: 'sm' | 'md' | 'lg',
): { width: number; height: number } {
  const height = size === 'sm' ? 32 : size === 'lg' ? 48 : 40;
  const aspect = BRAND_LOGO_DIMENSIONS[variant].aspect;
  return {
    height,
    width: Math.round(height * aspect),
  };
}
