import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import './crypto-polyfill';
import { getSupabasePublishableKey, getSupabaseUrl, isSupabaseConfigured } from './env';

export { isSupabaseConfigured };

export function createSupabaseClient() {
  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey();

  if (!url || !key) {
    throw new Error(
      'Google sign-in is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in mobile/.env'
    );
  }

  return createClient(url, key, {
    auth: {
      storage: AsyncStorage,
      flowType: 'pkce',
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: false,
    },
  });
}
