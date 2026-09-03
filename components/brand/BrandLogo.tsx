import { BRAND_NAME } from '@/lib/brand/constants';
import {
  getBrandLogoAssetPath,
  getBrandLogoDisplaySize,
  getBrandLogoSrcSet,
} from '@/lib/brand/logos';

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export type BrandLogoVariant = 'full' | 'icon' | 'wordmark';
export type BrandLogoTheme = 'light' | 'dark' | 'mono';

const sizeMap = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-12',
} as const;

export interface BrandLogoProps {
  variant?: BrandLogoVariant;
  theme?: BrandLogoTheme;
  size?: keyof typeof sizeMap;
  className?: string;
  priority?: boolean;
}

export function BrandLogo({
  variant = 'full',
  theme = 'dark',
  size = 'md',
  className,
  priority = false,
}: BrandLogoProps) {
  const src = getBrandLogoAssetPath(variant, theme);
  const srcSet = getBrandLogoSrcSet(variant, theme);
  const { width, height } = getBrandLogoDisplaySize(variant, size);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      srcSet={srcSet}
      alt={BRAND_NAME}
      width={width}
      height={height}
      className={cx(sizeMap[size], 'w-auto object-contain', className)}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
    />
  );
}
