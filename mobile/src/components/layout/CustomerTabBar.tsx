import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../ui/AppIcon';
import { PRIMARY_TAB_NAV } from '../../constants/navigation';
import { cn } from '../../lib/cn';

function isPrimaryTab(routeName: string): boolean {
  return PRIMARY_TAB_NAV.some(
    (item) => item.path === routeName || routeName.startsWith(item.path)
  );
}

type TabBarNavigation = {
  emit: (event: { type: 'tabPress'; target: string; canPreventDefault?: boolean }) => {
    defaultPrevented: boolean;
  };
  navigate: (name: string) => void;
};

type TabBarState = {
  index: number;
  routes: Array<{ key: string; name: string }>;
};

export function CustomerTabBar({
  state,
  navigation,
}: {
  state: TabBarState;
  navigation: TabBarNavigation;
}) {
  const insets = useSafeAreaInsets();
  const visibleRoutes = state.routes.filter((route) => isPrimaryTab(route.name));
  const activeRouteName = state.routes[state.index]?.name;

  return (
    <View
      className="border-t border-outline-variant/40 bg-surface-container-lowest"
      style={{ paddingBottom: Math.max(insets.bottom, 4) }}
    >
      <View className="flex-row items-stretch justify-around px-1 pt-1">
        {visibleRoutes.map((route) => {
          const navItem = PRIMARY_TAB_NAV.find(
            (item) => item.path === route.name || route.name.startsWith(item.path)
          );
          if (!navItem) {
            return null;
          }

          const isFocused = activeRouteName === route.name;
          const label = navItem.label;

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
                'min-h-[52px] flex-1 items-center justify-center rounded-lg px-1 py-1 active:opacity-80',
                isFocused && 'bg-primary-container/60'
              )}
            >
              <AppIcon
                name={navItem.icon}
                size={18}
                className={isFocused ? 'text-primary' : 'text-on-surface-variant'}
              />
              <Text
                className={cn(
                  'mt-0.5 text-[10px] leading-3',
                  isFocused ? 'font-bold text-primary' : 'font-medium text-on-surface-variant'
                )}
                numberOfLines={1}
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
      className="absolute right-4 z-50 h-12 w-12 items-center justify-center rounded-full bg-primary shadow-lg active:scale-95"
      style={{ bottom: Math.max(insets.bottom, 8) + 56 }}
    >
      <AppIcon name="add" size={26} className="text-on-primary" />
    </Pressable>
  );
}
