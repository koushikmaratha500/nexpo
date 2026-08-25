import { Text, View } from 'react-native';
import { APP_SUBTITLE, APP_TITLE } from '../../constants/navigation';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View className={compact ? 'mb-md' : 'mb-xl items-center'}>
      <View className="mb-sm h-12 w-12 items-center justify-center rounded-xl bg-primary">
        <Text className="font-headline-sm text-headline-sm font-black text-on-primary">E</Text>
      </View>
      <Text className="font-headline-lg text-headline-lg font-black tracking-tight text-primary">
        {APP_TITLE}
      </Text>
      <Text className="mt-1 font-label-md text-label-md font-bold uppercase tracking-widest text-on-surface-variant">
        {APP_SUBTITLE}
      </Text>
    </View>
  );
}
