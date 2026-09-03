'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';
import { useAuthStore, UserState } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { createClient } from '@/lib/supabase/client';

export interface User {
  username?: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  email: string;
  role: 'ADMIN' | 'CUSTOMER';
  status?: string;
  avatar?: string;
  mobile?: string;
  countryId?: string | null;
  currencyId?: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, isAdmin?: boolean) => Promise<{ success: boolean; error?: string; pendingVerification?: boolean; forcePasswordReset?: boolean }>;
  completeGoogleLogin: () => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  updateUser: (updatedFields: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// JWT helper to parse token claims on the client
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// Check if token expiration has passed
function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const payload = parseJwt(token);
    if (!payload || !payload.exp) return false;
    return payload.exp < Date.now() / 1000;
  } catch (e) {
    return true;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, token, setAuth, clearAuth, updateUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { addToast } = useToast();
  const toastShownRef = useRef(false);

  // Set dynamic request interceptor and handle hydration load
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        const latestToken = useAuthStore.getState().token;
        if (latestToken) {
          config.headers.Authorization = `Bearer ${latestToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    setIsLoading(false);

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, []);

  // Protected routes handler
  useEffect(() => {
    if (isLoading) return;

    const isPublicPage =
      pathname === '/' || pathname.startsWith('/r/') || pathname.startsWith('/auth/callback');
    const isAuthPage = pathname.startsWith('/auth') || isPublicPage;
    const isAdminAuthPage = pathname.startsWith('/admin/login') ||
      pathname.startsWith('/admin/forgot-password') ||
      pathname.startsWith('/admin/reset-password');
    
    if (!user) {
      if (!isAuthPage && !isAdminAuthPage) {
        if (pathname.startsWith('/admin')) {
          router.push('/admin/login');
        } else if (!isAuthPage) {
          router.push('/auth/login');
        }
      }
    } else {
      if (isAdminAuthPage && user.role === 'ADMIN') {
        router.push('/admin');
      } else if (pathname.startsWith('/admin') && user.role !== 'ADMIN') {
        router.push('/customer');
      } else if (pathname.startsWith('/customer') && user.role !== 'CUSTOMER') {
        router.push('/admin');
      }
    }
  }, [user, pathname, isLoading, router]);

  // Periodic JWT expiration check (every 10 seconds)
  useEffect(() => {
    if (isLoading) return;

    const checkTokenExpiration = () => {
      if (token && isTokenExpired(token)) {
        forceLogout();
      }
    };

    checkTokenExpiration();

    const interval = setInterval(checkTokenExpiration, 10000);
    return () => clearInterval(interval);
  }, [token, isLoading]);

  // Global Axios Interceptor for 401 and 404 unauthorized sessions
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const status = error.response.status;
          const url = error.config?.url || '';
          const isAuthOrProfileUrl = url.includes('/auth/') || url.includes('/profile') || url.includes('/user');
          
          if (status === 401 || (status === 404 && isAuthOrProfileUrl)) {
            forceLogout();
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [token]);

  const forceLogout = () => {
    clearAuth();
    delete axios.defaults.headers.common['Authorization'];

    // Redirect to the appropriate login based on current path
    if (pathname.startsWith('/admin')) {
      router.push('/admin/login');
    } else {
      router.push('/auth/login');
    }

    // De-duplicate toast warnings if triggered concurrently
    if (!toastShownRef.current) {
      toastShownRef.current = true;
      addToast('Please Re-login', 'error');
      // Reset ref after 2 seconds
      setTimeout(() => {
        toastShownRef.current = false;
      }, 2000);
    }
  };

  const login = async (email: string, password: string, isAdmin = false): Promise<{ success: boolean; error?: string; pendingVerification?: boolean; forcePasswordReset?: boolean }> => {
    if (!password || password.length <= 6) {
      return { success: false, error: 'Password must be more than 6 characters long.' };
    }

    const lowerEmail = email.toLowerCase().trim();
    const isAdminLogin = isAdmin || lowerEmail.includes('admin') || lowerEmail === 'admin@nexpo.com';
    const loginUrl = isAdminLogin ? '/api/admin/auth/login' : '/api/user/auth/login';

    try {
      const response = await axios.post(loginUrl, { email, password });
      if (response.data.success) {
        const resToken = response.data.token;
        const rawUser = response.data.user || response.data.admin;

        if (!isAdminLogin && response.data.forcePasswordReset) {
          localStorage.setItem('nexpo_forced_reset_token', resToken);
          localStorage.setItem('nexpo_forced_reset_email', lowerEmail);
          router.push('/auth/forced-reset');
          return { success: true, forcePasswordReset: true };
        }

        let loggedInUser: User;
        if (isAdminLogin) {
          loggedInUser = {
            firstName: rawUser.firstName,
            lastName: rawUser.lastName || '',
            email: rawUser.email,
            role: 'ADMIN',
          };
        } else {
          loggedInUser = {
            username: rawUser.username || '',
            firstName: rawUser.firstName,
            lastName: rawUser.lastName || '',
            phone: rawUser.phone || rawUser.mobile || '',
            email: rawUser.email,
            countryId: rawUser.countryId || null,
            currencyId: rawUser.currencyId || null,
            role: 'CUSTOMER',
          };
        }

        setAuth(loggedInUser, resToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${resToken}`;

        if (loggedInUser.role === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/customer');
        }
        return { success: true };
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Login failed';
      if (errorMsg.toLowerCase().includes('pending verification') || errorMsg.toLowerCase().includes('otp')) {
        localStorage.setItem('nexpo_pending_email', email);
        return { success: false, error: errorMsg, pendingVerification: true };
      }
      return { success: false, error: errorMsg };
    }

    return { success: false, error: 'Login request failed. Verify your connection or credentials.' };
  };

  const completeGoogleLogin = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session?.access_token) {
        return { success: false, error: 'Google sign-in session not found' };
      }

      const response = await axios.post('/api/user/auth/google', {
        accessToken: data.session.access_token,
      });

      if (!response.data.success) {
        return { success: false, error: response.data.error || 'Google sign-in failed' };
      }

      const rawUser = response.data.user;
      const loggedInUser: User = {
        username: rawUser.username || '',
        firstName: rawUser.firstName,
        lastName: rawUser.lastName || '',
        phone: rawUser.phone || rawUser.mobile || '',
        email: rawUser.email,
        countryId: rawUser.countryId || null,
        currencyId: rawUser.currencyId || null,
        role: 'CUSTOMER',
      };

      setAuth(loggedInUser, response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      await supabase.auth.signOut();
      router.push('/customer');
      return { success: true };
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
        (err as { message?: string }).message ||
        'Google sign-in failed';
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    const adminUrl = '/api/admin/logout';
    const customerUrl = '/api/user/logout';
    const logoutUrl = user?.role === 'ADMIN' ? adminUrl : customerUrl;

    if (token) {
      axios.post(logoutUrl, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
    }

    clearAuth();
    delete axios.defaults.headers.common['Authorization'];
    router.push('/auth/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-primary">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="font-label-md font-bold uppercase tracking-wider animate-pulse">Verifying Security Session...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, completeGoogleLogin, logout, isLoading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
