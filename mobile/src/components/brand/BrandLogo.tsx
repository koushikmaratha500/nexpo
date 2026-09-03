import { Image, Text, View } from 'react-native';
import { APP_TITLE } from '../../constants/navigation';

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export type BrandLogoVariant = 'full' | 'icon' | 'wordmark';
export type BrandLogoTheme = 'light' | 'dark' | 'mono';

function getLogoUrl(): string | null {
  const url = process.env.EXPO_PUBLIC_BRAND_LOGO_URL?.trim();
  return url || null;
}

function Monogram({
  className,
  theme,
}: {
  className?: string;
  theme: BrandLogoTheme;
}) {
  const bg =
    theme === 'light'
      ? 'border border-white/20 bg-white/15'
      : 'bg-primary';

  const text = theme === 'light' ? 'text-white' : 'text-on-primary';

  return (
    <View className={cx('items-center justify-center rounded-xl', bg, className)}>
      <Text className={cx('font-headline-sm text-headline-sm font-black', text)}>PS</Text>
    </View>
  );
}

export interface BrandLogoProps {
  variant?: BrandLogoVariant;
  theme?: BrandLogoTheme;
  compact?: boolean;
  className?: string;
}

export function BrandLogo({
  variant = 'full',
  theme = 'dark',
  compact = false,
  className,
}: BrandLogoProps) {
  const logoUrl = getLogoUrl();
  const wordmarkClass =
    theme === 'light' ? 'text-white' : theme === 'mono' ? 'text-primary' : 'text-on-surface';

  if (logoUrl) {
    return (
      <Image
        source={{ uri: logoUrl }}
          accessibilityLabel={APP_TITLE}
        className={cx('h-10 w-40', className)}
        resizeMode="contain"
      />
    );
  }

  if (variant === 'icon') {
    return <Monogram className={cx('h-12 w-12', className)} theme={theme} />;
  }

  if (variant === 'wordmark') {
    return (
      <Text className={cx('font-headline-lg text-headline-lg font-black tracking-tight', wordmarkClass, className)}>
        {APP_TITLE}
      </Text>
    );
  }

  return (
    <View className={cx(compact ? 'mb-md flex-row items-center gap-sm' : 'mb-xl items-center', className)}>
      <Monogram className={cx(compact ? 'h-10 w-10' : 'mb-sm h-12 w-12')} theme={theme} />
      <Text className={cx('font-headline-lg text-headline-lg font-black tracking-tight', wordmarkClass)}>
        {APP_TITLE}
      </Text>
    </View>
  );
}
