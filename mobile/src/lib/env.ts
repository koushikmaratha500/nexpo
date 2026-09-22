import Constants from 'expo-constants';
import { Platform } from 'react-native';

const LOCAL_API_HOSTS = new Set(['localhost', '127.0.0.1', '10.0.2.2']);

type ExpoExtra = {
  apiUrl?: string;
  supabaseUrl?: string;
  supabasePublishableKey?: string;
};

function readExtra(): ExpoExtra {
  return (Constants.expoConfig?.extra ?? {}) as ExpoExtra;
}

function trim(value: string | undefined | null): string {
  return value?.trim() ?? '';
}

/** Dev fallback when EXPO_PUBLIC_API_URL is unset (emulator / simulator). */
export function getDevDefaultApiUrl(): string {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }
  return 'http://localhost:3000';
}

/** Expo Go on a physical device — derive LAN IP from Metro host (e.g. 192.168.x.x:8081). */
export function getExpoDevLanApiUrl(): string | null {
  if (!__DEV__) {
    return null;
  }

  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants.expoGoConfig as { debuggerHost?: string } | undefined)?.debuggerHost;

  if (!hostUri) {
    return null;
  }

  const host = hostUri.split(':')[0]?.trim();
  if (!host || LOCAL_API_HOSTS.has(host)) {
    return null;
  }

  return `http://${host}:3000`;
}

function normalizeApiUrl(value: string): string {
  const normalized = value.replace(/\/$/, '');
  if (!__DEV__) {
    return normalized;
  }

  try {
    const { hostname } = new URL(normalized);
    if (!LOCAL_API_HOSTS.has(hostname)) {
      return normalized;
    }
  } catch {
    return normalized;
  }

  const lanApiUrl = getExpoDevLanApiUrl();
  return lanApiUrl ?? normalized;
}

export function getApiUrl(): string {
  const fromProcess = trim(process.env.EXPO_PUBLIC_API_URL);
  if (fromProcess) {
    return normalizeApiUrl(fromProcess);
  }

  const fromExtra = trim(readExtra().apiUrl);
  if (fromExtra) {
    return normalizeApiUrl(fromExtra);
  }

  if (__DEV__) {
    return getExpoDevLanApiUrl() ?? getDevDefaultApiUrl();
  }

  return '';
}

export function isApiConfigured(): boolean {
  return getApiUrl().length > 0;
}

export function getSupabaseUrl(): string {
  return (
    trim(process.env.EXPO_PUBLIC_SUPABASE_URL) ||
    trim(readExtra().supabaseUrl)
  );
}

export function getSupabasePublishableKey(): string {
  return (
    trim(process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
    trim(readExtra().supabasePublishableKey)
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey());
}

export function getApiConfigHint(): string {
  if (isApiConfigured()) {
    return getApiUrl();
  }

  return 'Create mobile/.env with EXPO_PUBLIC_API_URL (see mobile/.env.example)';
}
