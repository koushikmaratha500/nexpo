import { Pressable, Text, View } from 'react-native';
import { cn } from '../../lib/cn';

interface PillTabsProps<T extends string> {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
}

export function PillTabs<T extends string>({ tabs, active, onChange, className }: PillTabsProps<T>) {
  return (
    <View className={cn('flex-row flex-wrap gap-sm', className)}>
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            className={cn(
              'rounded-full px-4 py-2',
              isActive ? 'bg-primary' : 'bg-surface-container-low'
            )}
          >
            <Text
              className={cn(
                'font-label-md font-bold',
                isActive ? 'text-on-primary' : 'text-on-surface-variant'
              )}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
