import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { API_ROUTES, apiGet, getApiErrorMessage, type LoginResponse } from '@nexpo/shared';
import { mobileTokenStorage } from '../../src/lib/tokenStorage';
import { useAuthStore } from '../../src/store/authStore';

export default function GoogleAuthCallbackScreen() {
  const params = useLocalSearchParams<{
    token?: string;
    code?: string;
    error?: string;
    error_description?: string;
  }>();
  const [message, setMessage] = useState('Completing Google sign-in…');

  useEffect(() => {
    void (async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        const callbackUrl =
          initialUrl && initialUrl.includes('auth/callback') ? initialUrl : null;

        let token = typeof params.token === 'string' ? params.token : undefined;
        let error =
          typeof params.error_description === 'string'
            ? params.error_description
            : typeof params.error === 'string'
              ? params.error
              : undefined;

        if (callbackUrl) {
          const parsed = new URL(callbackUrl);
          token = parsed.searchParams.get('token') ?? token;
          error =
            parsed.searchParams.get('error_description') ||
            parsed.searchParams.get('error') ||
            error;
        }

        if (error) {
          setMessage(error);
          return;
        }

        if (!token) {
          setMessage('Google sign-in session not found');
          return;
        }

        await mobileTokenStorage.setToken(token);
        const profile = await apiGet<LoginResponse['user']>(API_ROUTES.auth.profile);
        if (!profile?.email) {
          setMessage('Google sign-in failed');
          return;
        }

        const loggedInUser = {
          username: profile.username || undefined,
          firstName: profile.firstName,
          lastName: profile.lastName || undefined,
          phone: profile.phone || profile.mobile || undefined,
          email: profile.email,
          countryId: profile.countryId ?? null,
          currencyId: profile.currencyId ?? null,
          role: 'CUSTOMER' as const,
        };

        useAuthStore.getState().setAuth(loggedInUser, token);
        router.replace('/(app)/(tabs)');
      } catch (err) {
        setMessage(getApiErrorMessage(err, 'Google sign-in failed'));
      }
    })();
  }, [params.token, params.error, params.error_description]);

  return (
    <View className="flex-1 items-center justify-center bg-background px-lg">
      <ActivityIndicator size="large" color="#7C3AED" />
      <Text className="mt-md text-center font-body-md text-on-surface-variant">{message}</Text>
    </View>
  );
}
