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

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
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

    if (token && isTokenExpired(token)) {
      void (async () => {
        await mobileTokenStorage.setToken(null);
        clearAuth();
      })();
    }
  }, [hydrated, token, clearAuth]);

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
    () => ({ user, token, isLoading, login, logout, updateUser }),
    [user, token, isLoading, login, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
