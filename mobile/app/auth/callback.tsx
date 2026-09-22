import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import {
  API_ROUTES,
  apiPost,
  getApiErrorMessage,
  type LoginResponse,
} from '@nexpo/shared';
import { completeGoogleOAuthFromUrl } from '../../src/lib/googleAuth';
import { mobileTokenStorage } from '../../src/lib/tokenStorage';
import { useAuthStore } from '../../src/store/authStore';

export default function GoogleAuthCallbackScreen() {
  const params = useLocalSearchParams<{ code?: string; error?: string; error_description?: string }>();
  const [message, setMessage] = useState('Completing Google sign-in…');

  useEffect(() => {
    void (async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        let callbackUrl = initialUrl && initialUrl.includes('auth/callback') ? initialUrl : null;

        if (!callbackUrl) {
          const query = new URLSearchParams();
          if (typeof params.code === 'string') query.set('code', params.code);
          if (typeof params.error === 'string') query.set('error', params.error);
          if (typeof params.error_description === 'string') {
            query.set('error_description', params.error_description);
          }
          const qs = query.toString();
          callbackUrl = `${Linking.createURL('auth/callback')}${qs ? `?${qs}` : ''}`;
        }

        const oauth = await completeGoogleOAuthFromUrl(callbackUrl);
        if ('error' in oauth) {
          setMessage(oauth.error);
          return;
        }

        const response = await apiPost<LoginResponse>(API_ROUTES.auth.google, {
          accessToken: oauth.accessToken,
        });

        if (!response.success || !response.token || !response.user) {
          setMessage('Google sign-in failed');
          return;
        }

        const loggedInUser = {
          username: response.user.username || undefined,
          firstName: response.user.firstName,
          lastName: response.user.lastName || undefined,
          phone: response.user.phone || response.user.mobile || undefined,
          email: response.user.email,
          countryId: response.user.countryId ?? null,
          currencyId: response.user.currencyId ?? null,
          role: 'CUSTOMER' as const,
        };

        await mobileTokenStorage.setToken(response.token);
        useAuthStore.getState().setAuth(loggedInUser, response.token);
        router.replace('/(app)/(tabs)');
      } catch (err) {
        setMessage(getApiErrorMessage(err, 'Google sign-in failed'));
      }
    })();
  }, [params.code, params.error, params.error_description]);

  return (
    <View className="flex-1 items-center justify-center bg-background px-lg">
      <ActivityIndicator size="large" color="#7C3AED" />
      <Text className="mt-md text-center font-body-md text-on-surface-variant">{message}</Text>
    </View>
  );
}
