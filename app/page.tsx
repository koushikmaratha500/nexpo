'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load remembered credentials if present
  useEffect(() => {
    const savedRememberMe = localStorage.getItem('nexpo_remember_me');
    if (savedRememberMe === 'true') {
      setRememberMe(true);
      const savedEmail = localStorage.getItem('nexpo_saved_email');
      const savedPassword = localStorage.getItem('nexpo_saved_password');
      if (savedEmail) setEmail(savedEmail);
      if (savedPassword) setPassword(savedPassword);
    }
  }, []);

  // If already logged in, redirect
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/customer');
      }
    }
  }, [user, isLoading, router]);

  const handlePreFill = (role: 'ADMIN' | 'CUSTOMER') => {
    if (role === 'ADMIN') {
      setEmail('admin@nexpo.com');
      setPassword('admin1234');
    } else {
      setEmail('user@nexpo.com');
      setPassword('user1234');
    }
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        if (rememberMe) {
          localStorage.setItem('nexpo_remember_me', 'true');
          localStorage.setItem('nexpo_saved_email', email);
          localStorage.setItem('nexpo_saved_password', password);
        } else {
          localStorage.removeItem('nexpo_remember_me');
          localStorage.removeItem('nexpo_saved_email');
          localStorage.removeItem('nexpo_saved_password');
        }
      } else {
        setErrorMsg(result.error || 'Authentication failed.');
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen bg-background p-4 relative overflow-hidden">
        {/* Background visual detail */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-on-tertiary-container blur-3xl"></div>
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-secondary-container blur-3xl"></div>
        </div>

        <div className="w-full max-w-md z-10 animate-pulse">
          {/* Header Skeleton */}
          <div className="text-center mb-8 flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-surface-container-highest mb-4"></div>
            <div className="h-6 w-48 bg-surface-container-highest rounded mb-2"></div>
            <div className="h-4 w-36 bg-surface-container-high rounded"></div>
          </div>

          {/* Card Skeleton */}
          <Card className="flex flex-col gap-6 bg-surface-container-lowest" glass={false}>
            <div className="flex flex-col gap-2">
              <div className="h-5 w-40 bg-surface-container-highest rounded"></div>
              <div className="h-4 w-72 bg-surface-container-high rounded"></div>
            </div>

            <div className="flex flex-col gap-4">
              {/* Email field skeleton */}
              <div className="flex flex-col gap-2">
                <div className="h-4 w-28 bg-surface-container-high rounded"></div>
                <div className="h-10 w-full bg-surface-container-low rounded-lg border border-outline-variant/30"></div>
              </div>

              {/* Password field skeleton */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <div className="h-4 w-20 bg-surface-container-high rounded"></div>
                  <div className="h-4 w-24 bg-surface-container-high rounded"></div>
                </div>
                <div className="h-10 w-full bg-surface-container-low rounded-lg border border-outline-variant/30"></div>
              </div>

              {/* Remember me checkbox skeleton */}
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-surface-container-high"></div>
                <div className="h-4 w-24 bg-surface-container-high rounded"></div>
              </div>

              {/* Button skeleton */}
              <div className="h-11 w-full bg-surface-container-highest rounded-lg"></div>
            </div>

            {/* Test accounts preset skeleton */}
            <div className="bg-surface-container-low/50 rounded-xl p-4 border border-outline-variant/30 flex flex-col gap-3">
              <div className="h-3 w-40 bg-surface-container-high rounded"></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-9 bg-surface-container-highest rounded-lg"></div>
                <div className="h-9 bg-surface-container-highest rounded-lg"></div>
              </div>
            </div>

            {/* Footer link skeleton */}
            <div className="flex justify-center">
              <div className="h-4 w-48 bg-surface-container-high rounded"></div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center min-h-screen bg-background p-4 relative overflow-hidden">
      {/* Background visual detail */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-on-tertiary-container blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-secondary-container blur-3xl"></div>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-on-primary mb-4 shadow-sm">
            <span className="material-symbols-outlined text-lg">corporate_fare</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-black tracking-tight text-primary">Corporate Pro Ledger</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Enterprise Expense Governance</p>
        </div>

        <Card className="flex flex-col gap-6 bg-surface-container-lowest" glass={false}>
          <div>
            <h2 className="font-title-md text-title-md font-bold text-primary">Sign in to account</h2>
            <p className="font-label-md text-label-md text-on-surface-variant mt-1">Enter your details to access reports & dashboards.</p>
          </div>

          {errorMsg && (
            <div className="p-4 bg-error-container/20 border border-error/20 text-error rounded-lg text-body-md font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-md">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all text-on-surface"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="font-label-md text-label-md text-on-primary-container hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all text-on-surface"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary accent-primary cursor-pointer"
              />
              <label
                htmlFor="remember-me"
                className="font-label-md text-label-md text-on-surface-variant font-bold cursor-pointer select-none"
              >
                Remember me
              </label>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11"
            >
              {isSubmitting ? (
                <span className="material-symbols-outlined animate-spin text-sm">sync</span>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Preset testing fills */}
          <div className="bg-surface-container-low/50 rounded-xl p-4 border border-outline-variant/30 flex flex-col gap-2">
            <p className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
              Simulated Testing Accounts
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handlePreFill('ADMIN')}
                className="flex items-center justify-center gap-1 py-2 px-4 rounded-lg border border-outline-variant bg-surface-container-lowest text-label-md font-medium text-on-surface hover:bg-surface-container-low transition-all"
              >
                <span className="material-symbols-outlined text-xs">admin_panel_settings</span>
                Admin Auto-Fill
              </button>
              <button
                type="button"
                onClick={() => handlePreFill('CUSTOMER')}
                className="flex items-center justify-center gap-1 py-2 px-4 rounded-lg border border-outline-variant bg-surface-container-lowest text-label-md font-medium text-on-surface hover:bg-surface-container-low transition-all"
              >
                <span className="material-symbols-outlined text-xs">person</span>
                User Auto-Fill
              </button>
            </div>
          </div>

          <div className="text-center text-label-md text-on-surface-variant">
            Need an account?{' '}
            <Link href="/auth/register" className="text-primary font-bold hover:underline">
              Register here
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
