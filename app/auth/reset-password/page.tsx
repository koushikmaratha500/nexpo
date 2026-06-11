'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/components/auth/AuthContext';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { isLoading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length <= 6) {
      setErrorMsg('Password must be more than 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push('/');
    }, 2500);
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
              {/* Password field skeleton */}
              <div className="flex flex-col gap-2">
                <div className="h-4 w-28 bg-surface-container-high rounded font-bold"></div>
                <div className="h-10 w-full bg-surface-container-low rounded-lg border border-outline-variant/30"></div>
              </div>

              {/* Confirm Password field skeleton */}
              <div className="flex flex-col gap-2">
                <div className="h-4 w-28 bg-surface-container-high rounded font-bold"></div>
                <div className="h-10 w-full bg-surface-container-low rounded-lg border border-outline-variant/30"></div>
              </div>

              {/* Button skeleton */}
              <div className="h-11 w-full bg-surface-container-highest rounded-lg"></div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center min-h-screen bg-background p-4 relative overflow-hidden">
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-on-primary mb-4 shadow-sm">
            <span className="material-symbols-outlined text-lg">lock_reset</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-black tracking-tight text-primary">Corporate Pro Ledger</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Establish New Credentials</p>
        </div>

        <Card className="flex flex-col gap-6 bg-surface-container-lowest" glass={false}>
          {success ? (
            <div className="text-center py-8 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-xl">check</span>
              </div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-primary">Password Updated!</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Your credentials have been successfully updated. Redirecting to sign in page...
              </p>
            </div>
          ) : (
            <>
              <div>
                <h2 className="font-title-md text-title-md font-bold text-primary">Reset your password</h2>
                <p className="font-label-md text-label-md text-on-surface-variant mt-1">Define a new strong security credential for your workspace.</p>
              </div>

              {errorMsg && (
                <div className="p-4 bg-error-container/20 border border-error/20 text-error rounded-lg text-body-md font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-md">error</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="pass" className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide">
                    New Password (min. 7 chars)
                  </label>
                  <input
                    id="pass"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all text-on-surface"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="confirmPass" className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPass"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all text-on-surface"
                  />
                </div>

                <Button type="submit" className="w-full h-11">
                  Update Password
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
