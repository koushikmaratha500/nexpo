import { Image, ImageSourcePropType, View } from 'react-native';
import { APP_TITLE } from '../../constants/navigation';

export type BrandLogoVariant = 'full' | 'icon' | 'wordmark';
export type BrandLogoTheme = 'light' | 'dark' | 'mono';

const logoSources: Record<BrandLogoVariant, Record<BrandLogoTheme, ImageSourcePropType>> = {
  full: {
    dark: require('../../assets/brand/logo-full-dark.png'),
    light: require('../../assets/brand/logo-full-light.png'),
    mono: require('../../assets/brand/logo-full-mono.png'),
  },
  icon: {
    dark: require('../../assets/brand/logo-icon-dark.png'),
    light: require('../../assets/brand/logo-icon-light.png'),
    mono: require('../../assets/brand/logo-icon-mono.png'),
  },
  wordmark: {
    dark: require('../../assets/brand/logo-wordmark-dark.png'),
    light: require('../../assets/brand/logo-wordmark-light.png'),
    mono: require('../../assets/brand/logo-wordmark-mono.png'),
  },
};

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
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
  const source = logoSources[variant][theme];
  const heightClass = variant === 'icon' ? (compact ? 'h-10' : 'h-12') : compact ? 'h-10' : 'h-12';
  const widthClass = variant === 'icon' ? (compact ? 'w-10' : 'w-12') : compact ? 'w-40' : 'w-48';

  return (
    <View className={cx(compact ? 'flex-row items-center' : 'items-center', className)}>
      <Image
        source={source}
        accessibilityLabel={APP_TITLE}
        className={cx(heightClass, widthClass)}
        resizeMode="contain"
      />
    </View>
  );
}
