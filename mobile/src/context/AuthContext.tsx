import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import {
  API_ROUTES,
  apiPost,
  configureApiClient,
  getApiErrorMessage,
  isTokenExpired,
  type LoginResponse,
  type User,
} from '@nexpo/shared';
import { useAuthStore } from '../store/authStore';
import { mobileTokenStorage } from '../lib/tokenStorage';
import { isSupabaseConfigured } from '../lib/supabase';
import { signInWithGoogleOAuth } from '../lib/googleAuth';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (fields: Partial<User & { avatar?: string }>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapCustomerUser(raw: NonNullable<LoginResponse['user']>): User {
  return {
    username: raw.username || undefined,
    firstName: raw.firstName,
    lastName: raw.lastName || undefined,
    phone: raw.phone || raw.mobile || undefined,
    email: raw.email,
    countryId: raw.countryId ?? null,
    currencyId: raw.currencyId ?? null,
    role: 'CUSTOMER',
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, token, hydrated, setAuth, clearAuth } = useAuthStore();
  const isLoading = !hydrated;

  useEffect(() => {
    configureApiClient(mobileTokenStorage);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    void (async () => {
      const secureToken = await mobileTokenStorage.getToken();
      const current = useAuthStore.getState();
      if (secureToken && current.user && !current.token) {
        useAuthStore.getState().setToken(secureToken);
      }
      if (secureToken && isTokenExpired(secureToken)) {
        await mobileTokenStorage.setToken(null);
        clearAuth();
      }
    })();
  }, [hydrated, clearAuth]);

  const updateUser = useCallback((fields: Partial<User & { avatar?: string }>) => {
    const current = useAuthStore.getState().user;
    if (!current) return;
    useAuthStore.setState({ user: { ...current, ...fields } });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!password || password.length <= 6) {
      return { success: false, error: 'Password must be more than 6 characters long.' };
    }

    try {
      const response = await apiPost<LoginResponse>(API_ROUTES.auth.login, {
        email: email.toLowerCase().trim(),
        password,
      });

      if (!response.success || !response.token || !response.user) {
        return { success: false, error: 'Login failed' };
      }

      if (response.forcePasswordReset) {
        return {
          success: false,
          error: 'Password reset required. Complete reset on the web app first.',
        };
      }

      const loggedInUser = mapCustomerUser(response.user);
      await mobileTokenStorage.setToken(response.token);
      setAuth(loggedInUser, response.token);
      return { success: true };
    } catch (err) {
      return { success: false, error: getApiErrorMessage(err, 'Login failed') };
    }
  }, [setAuth]);

  const loginWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Google sign-in is not configured on this build.' };
    }

    try {
      const oauth = await signInWithGoogleOAuth();
      if ('error' in oauth) {
        return { success: false, error: oauth.error };
      }

      const response = await apiPost<LoginResponse>(API_ROUTES.auth.google, {
        accessToken: oauth.accessToken,
      });

      if (!response.success || !response.token || !response.user) {
        return { success: false, error: 'Google sign-in failed' };
      }

      const loggedInUser = mapCustomerUser(response.user);
      await mobileTokenStorage.setToken(response.token);
      setAuth(loggedInUser, response.token);
      return { success: true };
    } catch (err) {
      return { success: false, error: getApiErrorMessage(err, 'Google sign-in failed') };
    }
  }, [setAuth]);

  const logout = useCallback(async () => {
    if (token) {
      try {
        await apiPost(API_ROUTES.auth.logout, {});
      } catch {
        // ignore network errors on logout
      }
    }
    await mobileTokenStorage.setToken(null);
    clearAuth();
  }, [token, clearAuth]);

  const value = useMemo(
    () => ({ user, token, isLoading, login, loginWithGoogle, logout, updateUser }),
    [user, token, isLoading, login, loginWithGoogle, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
