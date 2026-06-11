'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { MOCK_USERS, User } from '@/mock/data';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchRole: (role: 'ADMIN' | 'CUSTOMER') => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('nexpo_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('nexpo_user');
      }
    }
    setIsLoading(false);
  }, []);

  // Protected routes handler
  useEffect(() => {
    if (isLoading) return;

    const isAuthPage = pathname.startsWith('/auth') || pathname === '/';
    
    if (!user) {
      // Redirect to login if not authenticated and trying to access app pages
      if (!isAuthPage) {
        router.push('/');
      }
    } else {
      // Redirect to dashboard if logged in and trying to access login pages
      if (pathname === '/') {
        if (user.role === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/customer');
        }
      } else if (pathname.startsWith('/admin') && user.role !== 'ADMIN') {
        router.push('/customer');
      } else if (pathname.startsWith('/customer') && user.role !== 'CUSTOMER') {
        router.push('/admin');
      }
    }
  }, [user, pathname, isLoading, router]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Password validation (must be > 6 chars)
    if (!password || password.length <= 6) {
      return { success: false, error: 'Password must be more than 6 characters long.' };
    }

    const lowerEmail = email.toLowerCase().trim();
    let matchedUser: User | undefined;

    if (lowerEmail === 'admin@nexpo.com') {
      matchedUser = MOCK_USERS.find(u => u.role === 'ADMIN');
    } else if (lowerEmail === 'user@nexpo.com') {
      matchedUser = MOCK_USERS.find(u => u.email === 'user@nexpo.com');
    }

    if (matchedUser) {
      if (matchedUser.status === 'BLOCKED') {
        router.push('/auth/blocked');
        return { success: false, error: 'This account has been blocked. Contact administrator.' };
      }
      
      setUser(matchedUser);
      localStorage.setItem('nexpo_user', JSON.stringify(matchedUser));
      
      if (matchedUser.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/customer');
      }
      return { success: true };
    }

    return { success: false, error: 'Invalid email address. Please use admin@nexpo.com or user@nexpo.com.' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('nexpo_user');
    router.push('/');
  };

  const switchRole = (role: 'ADMIN' | 'CUSTOMER') => {
    const targetUser = MOCK_USERS.find(u => u.role === role);
    if (targetUser) {
      setUser(targetUser);
      localStorage.setItem('nexpo_user', JSON.stringify(targetUser));
      if (role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/customer');
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, switchRole, isLoading }}>
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
