import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../ui/AppIcon';
import { CUSTOMER_NAV } from '../../constants/navigation';
import { cn } from '../../lib/cn';

export function CustomerTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="border-t border-outline-variant bg-surface-container-lowest shadow-2xl"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      <View className="flex-row items-center justify-around px-2 py-2">
        {state.routes.map((route, index) => {
          const navItem = CUSTOMER_NAV.find((item) => item.path === route.name || route.name.startsWith(item.path));
          const isFocused = state.index === index;
          const label = navItem?.label ?? route.name;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              className={cn(
                'min-w-[44px] items-center justify-center rounded-xl px-2 py-1 active:scale-95',
                isFocused && 'bg-primary-container shadow-sm'
              )}
            >
              <AppIcon
                name={navItem?.icon ?? 'dashboard'}
                size={20}
                className={isFocused ? 'text-on-primary-container' : 'text-on-surface-variant'}
              />
              <Text
                className={cn(
                  'mt-1 text-[10px] font-label-md',
                  isFocused ? 'font-bold text-on-primary-container' : 'text-on-surface-variant'
                )}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function FabAddTransaction() {
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      onPress={() => router.push('/(app)/(tabs)/transactions?openAdd=1')}
      className="absolute right-[50px] z-50 h-14 w-14 items-center justify-center rounded-full bg-black shadow-xl active:scale-95"
      style={{ bottom: Math.max(insets.bottom, 16) + 72 }}
    >
      <AppIcon name="add" size={32} className="text-white" />
    </Pressable>
  );
}
