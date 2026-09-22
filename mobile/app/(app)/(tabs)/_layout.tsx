import { useEffect } from 'react';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../../../src/context/AuthContext';
import { CustomerTabBar, FabAddTransaction } from '../../../src/components/layout/CustomerTabBar';
import {
  CustomerNavMenu,
  HamburgerMenuButton,
} from '../../../src/components/layout/CustomerNavMenu';
import { AppIcon } from '../../../src/components/ui/AppIcon';
import { useMobilePlanContext } from '../../../src/context/PlanContext';
import { PlanStatusBanner } from '../../../src/components/billing/PlanStatusBanner';
import { NavMenuProvider } from '../../../src/context/NavMenuContext';

export default function TabsLayout() {
  const { user, isLoading } = useAuth();
  const { plan } = useMobilePlanContext();

  useEffect(() => {
    void WebBrowser.warmUpAsync();
  }, []);

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

  const screenHeader = {
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
  } as const;

  return (
    <NavMenuProvider>
      <View className="flex-1">
        <PlanStatusBanner />
        <Tabs
          tabBar={(props) => (
            <CustomerTabBar state={props.state} navigation={props.navigation as never} />
          )}
          screenOptions={screenHeader}
        >
          <Tabs.Screen name="index" options={{ title: 'Home' }} />
          <Tabs.Screen name="transactions" options={{ title: 'Expenses' }} />
          <Tabs.Screen name="assistant" options={{ title: 'AI Assistant' }} />
          <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
          <Tabs.Screen
            name="groups"
            options={{ href: null, title: 'Groups', headerShown: false }}
          />
          <Tabs.Screen name="reminders" options={{ href: null, title: 'Reminders' }} />
          <Tabs.Screen name="reports" options={{ href: null, title: 'Reports' }} />
        </Tabs>
        {!plan?.writesLocked ? <FabAddTransaction /> : null}
        <CustomerNavMenu />
      </View>
    </NavMenuProvider>
  );
}
