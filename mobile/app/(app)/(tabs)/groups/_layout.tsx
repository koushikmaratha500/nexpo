import { Stack } from 'expo-router';
import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { HamburgerMenuButton } from '../../../../src/components/layout/CustomerNavMenu';
import { AppIcon } from '../../../../src/components/ui/AppIcon';

export default function GroupsTabLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#f7f9fb' },
        headerTintColor: '#000000',
        headerTitleStyle: { fontFamily: 'Figtree_700Bold', fontSize: 17 },
        headerShadowVisible: false,
        headerLeft: () => <HamburgerMenuButton />,
        headerRight: () => (
          <Pressable
            onPress={() => router.push('/(app)/notifications')}
            className="mr-4 rounded-full bg-surface-container-low p-2 active:bg-surface-container"
          >
            <AppIcon name="notifications" size={20} className="text-on-surface-variant" />
          </Pressable>
        ),
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Groups' }} />
    </Stack>
  );
}
