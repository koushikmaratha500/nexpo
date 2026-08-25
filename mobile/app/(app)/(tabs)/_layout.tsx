import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';
import { CustomerTabBar, FabAddTransaction } from '../../../src/components/layout/CustomerTabBar';
import { AppIcon } from '../../../src/components/ui/AppIcon';

export default function TabsLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <View className="flex-1">
      <Tabs
        tabBar={(props) => <CustomerTabBar {...props} />}
        screenOptions={{
          headerStyle: { backgroundColor: '#f7f9fb' },
          headerTintColor: '#000000',
          headerTitleStyle: { fontFamily: 'Figtree_700Bold' },
          headerShadowVisible: false,
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/(app)/notifications')}
              className="mr-4 rounded-full bg-surface-container-low p-2 active:bg-surface-container"
            >
              <AppIcon name="notifications" size={22} className="text-on-surface-variant" />
            </Pressable>
          ),
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
        <Tabs.Screen name="transactions" options={{ title: 'Transactions' }} />
        <Tabs.Screen name="groups" options={{ title: 'Groups', headerShown: false }} />
        <Tabs.Screen name="reminders" options={{ title: 'Reminders' }} />
        <Tabs.Screen name="reports" options={{ title: 'Reports' }} />
        <Tabs.Screen name="assistant" options={{ title: 'AI Assistant' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      </Tabs>
      <FabAddTransaction />
    </View>
  );
}
