'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';


const inputClassName =
  'block w-full px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all text-on-surface pr-12';

interface ResetPasswordFormProps {
  token?: string;
  onSuccess?: () => void;
}

export function ResetPasswordForm({ token: initialToken, onSuccess }: ResetPasswordFormProps) {
  const [token, setToken] = useState(initialToken || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    onSuccess?.();
    setTimeout(() => {
      window.location.href = '/';
    }, 2500);
  };

  if (success) {
    return (
      <div className="text-center py-8 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mb-4">
          <span className="material_symbols-outlined text-xl">check</span>
        </div>
        <h2 className="font-headline-sm text-headline-sm font-bold text-primary">Password Updated!</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Your credentials have been successfully updated. Redirecting to sign in page...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {!initialToken && (
        <div className="flex flex-col gap-1">
          <label htmlFor="reset-token" className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide">
            Reset Token
          </label>
          <input
            id="reset-token"
            type="text"
            required
            placeholder="Paste your reset token here"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className={inputClassName.replace(' pr-12', '')}
          />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="reset-password" className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide">
          New Password (min. 7 chars)
        </label>
        <div className="relative w-full">
          <input
            id="reset-password"
            type={showPassword ? 'text' : 'password'}
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClassName}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <span className="material_symbols-outlined text-xs scale-90">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="reset-confirm-password" className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide">
          Confirm Password
        </label>
        <div className="relative w-full">
          <input
            id="reset-confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            required
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClassName}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            <span className="material_symbols-outlined text-xs scale-90">
              {showConfirmPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-error-container/20 border border-error/20 text-error rounded-lg text-body-md font-medium flex items-center gap-2">
          <span className="material_symbols-outlined text-md">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <Button type="submit" className="w-full h-11">
        Update Password
      </Button>
    </form>
  );
}

export function ResetPasswordPageWrapper({ token }: { token?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center min-h-screen bg-background p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-on-tertiary-container blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-secondary-container blur-3xl"></div>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-on-primary mb-4 shadow-sm">
            <span className="material_symbols-outlined text-lg">lock_reset</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-black tracking-tight text-primary">Corporate Pro Ledger</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Establish New Credentials</p>
        </div>

        <Card className="flex flex-col gap-6 bg-surface-container-lowest" glass={false}>
          <div>
            <h2 className="font-title-md text-title-md font-bold text-primary">Reset your password</h2>
            <p className="font-label-md text-label-md text-on-surface-variant mt-1">Define a new strong security credential for your workspace.</p>
          </div>

          <ResetPasswordForm token={token} />
        </Card>
      </div>
    </div>
  );
}
