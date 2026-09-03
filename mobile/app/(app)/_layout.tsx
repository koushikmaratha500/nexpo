import { View } from 'react-native';
import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <View className="flex-1 bg-background">
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#f7f9fb' },
          headerTintColor: '#000000',
          headerTitleStyle: { fontFamily: 'Figtree_600SemiBold' },
          contentStyle: { backgroundColor: '#f7f9fb' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="groups/[id]" options={{ title: 'Group' }} />
        <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
        <Stack.Screen name="support" options={{ title: 'Help Center' }} />
      </Stack>
    </View>
  );
}
