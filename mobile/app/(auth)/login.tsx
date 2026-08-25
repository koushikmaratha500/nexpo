import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { BrandMark } from '../../src/components/layout/BrandMark';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
              Access your Corporate Pro Ledger on mobile.
            </Text>
          </View>

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

          <Button title="Sign in" loading={submitting} onPress={onSubmit} className="mt-sm" />
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
}
