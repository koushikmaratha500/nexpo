import { Stack } from 'expo-router';

export default function GroupsTabLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Groups' }} />
    </Stack>
  );
}
