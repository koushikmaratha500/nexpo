import Image from 'next/image';
import { BRAND_NAME, getBrandLogoUrl } from '@/lib/brand/constants';

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export type BrandLogoVariant = 'full' | 'icon' | 'wordmark';
export type BrandLogoTheme = 'light' | 'dark' | 'mono';

const sizeMap = {
  sm: { icon: 'h-8 w-8', text: 'text-base', gap: 'gap-2' },
  md: { icon: 'h-10 w-10', text: 'text-lg', gap: 'gap-2.5' },
  lg: { icon: 'h-12 w-12', text: 'text-xl', gap: 'gap-3' },
} as const;

function Monogram({ className, theme }: { className?: string; theme: BrandLogoTheme }) {
  const bg =
    theme === 'light'
      ? 'bg-white/15 text-white border border-white/20'
      : theme === 'dark'
        ? 'bg-primary text-on-primary'
        : 'bg-primary text-on-primary';

  return (
    <div
      className={cx(
        'flex shrink-0 items-center justify-center rounded-xl font-black tracking-tight',
        bg,
        className,
      )}
      aria-hidden
    >
      PS
    </div>
  );
}

export interface BrandLogoProps {
  variant?: BrandLogoVariant;
  theme?: BrandLogoTheme;
  size?: keyof typeof sizeMap;
  className?: string;
}

export function BrandLogo({
  variant = 'full',
  theme = 'dark',
  size = 'md',
  className,
}: BrandLogoProps) {
  const logoUrl = getBrandLogoUrl();
  const sizes = sizeMap[size];
  const wordmarkClass =
    theme === 'light'
      ? 'text-white'
      : theme === 'mono'
        ? 'text-primary'
        : 'text-on-surface';

  if (logoUrl) {
    if (variant === 'icon') {
      return (
        <Image
          src={logoUrl}
          alt={BRAND_NAME}
          width={48}
          height={48}
          className={cx('h-10 w-auto object-contain', className)}
          priority
        />
      );
    }
    return (
      <Image
        src={logoUrl}
        alt={BRAND_NAME}
        width={180}
        height={48}
        className={cx('h-10 w-auto object-contain', className)}
        priority
      />
    );
  }

  if (variant === 'icon') {
    return <Monogram className={cx(sizes.icon, 'text-sm', className)} theme={theme} />;
  }

  if (variant === 'wordmark') {
    return (
      <span className={cx('font-headline-sm font-black tracking-tight', sizes.text, wordmarkClass, className)}>
        {BRAND_NAME}
      </span>
    );
  }

  return (
    <div className={cx('flex items-center', sizes.gap, className)}>
      <Monogram className={cx(sizes.icon, 'text-sm')} theme={theme} />
      <span className={cx('font-headline-sm font-black tracking-tight leading-none', sizes.text, wordmarkClass)}>
        {BRAND_NAME}
      </span>
    </div>
  );
}
