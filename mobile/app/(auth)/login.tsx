import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { BrandMark } from '../../src/components/layout/BrandMark';
import { AuthSocialDivider, GoogleSignInButton } from '../../src/components/auth/GoogleSignInButton';
import { getApiConfigHint, getApiUrl, isApiConfigured, isSupabaseConfigured } from '../../src/lib/env';
import { getGoogleOAuthReturnPrefix } from '../../src/lib/googleAuth';
import { APP_TITLE } from '../../src/constants/navigation';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';

export default function LoginScreen() {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const googleEnabled = isSupabaseConfigured();
  const apiConfigured = isApiConfigured();

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      router.replace('/(app)/(tabs)');
      return;
    }
    setError(result.error ?? 'Login failed');
  };

  const onGoogleSignIn = async () => {
    setError(null);
    setGoogleSubmitting(true);
    const result = await loginWithGoogle();
    setGoogleSubmitting(false);

    if (result.success) {
      router.replace('/(app)/(tabs)');
      return;
    }
    setError(result.error ?? 'Google sign-in failed');
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-1 justify-center px-lg py-2xl">
        <BrandMark />
        <Card glass className="gap-md">
          <View>
            <Text className="font-headline-md text-headline-md font-black text-primary">Sign in</Text>
            <Text className="mt-1 font-body-md text-on-surface-variant">
              Access {APP_TITLE} on mobile.
            </Text>
          </View>

          {!apiConfigured ? (
            <View className="rounded-lg border border-error-container bg-error-container/30 p-sm">
              <Text className="font-label-md text-label-md font-semibold text-error">
                API URL not configured
              </Text>
              <Text className="mt-1 font-body-md text-on-surface-variant">
                Copy mobile/.env.example to mobile/.env or run npm run mobile:sync-env from the repo root.
              </Text>
            </View>
          ) : __DEV__ ? (
            <Text className="font-label-sm text-label-sm text-on-surface-variant">
              API: {getApiUrl()}
            </Text>
          ) : null}

          <Input
            label="Email"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="you@company.com"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            label="Password"
            secureTextEntry
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text className="text-sm font-semibold text-error">{error}</Text> : null}

          <Button
            title="Sign in"
            loading={submitting}
            onPress={onSubmit}
            className="mt-sm"
            disabled={!apiConfigured}
          />

          <AuthSocialDivider />
          <GoogleSignInButton
            loading={googleSubmitting}
            disabled={submitting || !apiConfigured || !googleEnabled}
            onPress={onGoogleSignIn}
          />
          {!googleEnabled ? (
            <Text className="text-center font-label-sm text-label-sm text-on-surface-variant">
              Google sign-in needs EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in
              mobile/.env (same values as web NEXT_PUBLIC_SUPABASE_*).
            </Text>
          ) : __DEV__ ? (
            <Text className="text-center font-label-sm text-label-sm text-on-surface-variant">
              Add to Supabase redirect URLs:{'\n'}
              {getGoogleOAuthReturnPrefix()}
            </Text>
          ) : null}
        </Card>

        {__DEV__ && !apiConfigured ? (
          <Text className="mt-md text-center font-label-sm text-label-sm text-on-surface-variant">
            {getApiConfigHint()}
          </Text>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}
