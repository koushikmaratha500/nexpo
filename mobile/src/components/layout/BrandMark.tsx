import { BrandLogo } from '../brand/BrandLogo';
import { APP_SUBTITLE } from '../../constants/navigation';
import { Text, View } from 'react-native';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View className={compact ? 'mb-md' : 'mb-xl items-center'}>
      <BrandLogo variant="full" theme="mono" compact={compact} />
      {!compact ? (
        <Text className="mt-1 font-label-md text-label-md font-bold uppercase tracking-widest text-on-surface-variant">
          {APP_SUBTITLE}
        </Text>
      ) : null}
    </View>
  );
}
