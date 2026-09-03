'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useToast } from '@/hooks/useToast';

const inputClassName =
  'block w-full px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all text-on-surface';

interface ForgotPasswordSuccess {
  email: string;
  devToken?: string;
}

export function ForgotPasswordForm() {
  const router = useRouter();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState<ForgotPasswordSuccess | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const response = await axios.post<{
        success?: boolean;
        error?: string;
        devToken?: string;
      }>('/api/user/auth/forgot-password', { email });

      if (response.data?.success) {
        const devToken = response.data.devToken;

        if (devToken) {
          addToast('Development mode: opening reset password page.', 'success');
          router.push(`/auth/reset-password?token=${encodeURIComponent(devToken)}`);
          return;
        }

        setSuccess({ email });
        addToast('If an account exists, a reset link was sent to your email.', 'success');
      } else {
        const errMsg = response.data?.error || 'Failed to send recovery email.';
        setErrorMsg(errMsg);
        addToast(errMsg, 'error');
      }
    } catch (err: unknown) {
      const errMsg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Failed to send recovery email. Please try again.';
      setErrorMsg(errMsg);
      addToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-6 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center">
          <span className="material-symbols-outlined text-xl">mail</span>
        </div>
        <h2 className="font-headline-sm text-headline-sm font-bold text-primary">Check your email</h2>
        <div className="font-body-md text-body-md text-on-surface-variant max-w-sm text-left space-y-3">
          <p>
            If an account exists for <strong>{success.email}</strong>, we sent a password reset link to that inbox.
          </p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Open the email from PaysaSuchan</li>
            <li>Click the reset link (valid for 1 hour)</li>
            <li>Choose a new password on the reset page</li>
          </ol>
          <p className="text-label-md">
            Password reset uses your registered email address, not your phone number.
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full mt-2">
          <Link href="/auth/login" className="w-full">
            <Button variant="secondary" className="w-full">
              Return to Login
            </Button>
          </Link>
          <button
            type="button"
            className="font-label-md text-primary font-bold hover:underline"
            onClick={() => {
              setSuccess(null);
              setEmail('');
            }}
          >
            Send another link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-title-md text-title-md font-bold text-primary">Reset password</h2>
      <p className="font-label-md text-label-md text-on-surface-variant mt-1">
        Enter the email on your account. We&apos;ll email you a secure link to set a new password.
      </p>

      {errorMsg && (
        <div className="p-4 mt-4 bg-error-container/20 border border-error/20 text-error rounded-lg text-body-md font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-md">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="forgot-email" className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide">
            Email Address
          </label>
          <input
            id="forgot-email"
            type="email"
            required
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClassName}
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full h-11">
          {isLoading ? (
            <span className="material-symbols-outlined animate-spin text-sm">sync</span>
          ) : (
            'Send Recovery Link'
          )}
        </Button>
      </form>

      <div className="text-center text-label-md text-on-surface-variant mt-4">
        Remember your credentials?{' '}
        <Link href="/auth/login" className="text-primary font-bold hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}

export function ForgotPasswordPageWrapper() {
  return (
    <div className="flex flex-1 items-center justify-center min-h-screen bg-background p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-on-tertiary-container blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-secondary-container blur-3xl"></div>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-on-primary mb-4 shadow-sm">
            <span className="material-symbols-outlined text-lg">corporate_fare</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-black tracking-tight text-primary">PaysaSuchan</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Credentials Recovery</p>
        </div>

        <Card className="flex flex-col gap-6 bg-surface-container-lowest" glass={false}>
          <ForgotPasswordForm />
        </Card>
      </div>
    </div>
  );
}
