import { Text, View } from 'react-native';
import { Button } from '../ui/Button';

interface GoogleSignInButtonProps {
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

function GoogleIcon() {
  return <Text className="text-lg font-bold text-[#4285F4]">G</Text>;
}

export function AuthSocialDivider() {
  return (
    <View className="my-1 flex-row items-center gap-3">
      <View className="h-px flex-1 bg-outline-variant/50" />
      <Text className="font-label-md text-label-md font-bold uppercase tracking-wider text-on-surface-variant">
        or
      </Text>
      <View className="h-px flex-1 bg-outline-variant/50" />
    </View>
  );
}

export function GoogleSignInButton({ loading, disabled, onPress }: GoogleSignInButtonProps) {
  return (
    <Button
      variant="secondary"
      loading={loading}
      disabled={disabled}
      onPress={onPress}
      className="w-full rounded-full border-outline-variant"
    >
      <GoogleIcon />
      <Text className="font-title-md text-title-md text-on-surface">Continue with Google</Text>
    </Button>
  );
}
