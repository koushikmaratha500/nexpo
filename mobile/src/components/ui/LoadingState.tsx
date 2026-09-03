import { ActivityIndicator, Text, View } from 'react-native';

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-md p-2xl">
      <ActivityIndicator size="large" color="#000000" />
      <Text className="text-center font-body-md text-on-surface-variant">{message}</Text>
    </View>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <View className="items-center justify-center p-2xl">
      <Text className="text-center font-body-md text-on-surface-variant">{message}</Text>
    </View>
  );
}
