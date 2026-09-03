'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import axios from 'axios';
import { useToast } from '@/hooks/useToast';

const inputClassName =
  'px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all text-on-surface';

export function ActivateForm() {
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const emailInitialized = useRef(false);

  useEffect(() => {
    if (emailInitialized.current) return;
    emailInitialized.current = true;
    const pending = localStorage.getItem('nexpo_pending_email') || '';
    setEmail(pending);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email) {
      setErrorMsg('Please specify the email address to verify.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post('/api/user/auth/verify', {
        email: email.trim(),
        otp: code.trim(),
      });

      if (response.data.success) {
        setSuccess(true);
        localStorage.removeItem('nexpo_pending_email');
        addToast('Account verified successfully!', 'success');
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 2000);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setErrorMsg(e.response?.data?.error || e.message || 'Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setErrorMsg('Enter your email address before requesting a new code.');
      return;
    }

    setErrorMsg('');
    setIsResending(true);
    try {
      const response = await axios.post('/api/user/auth/resend-otp', {
        email: email.trim(),
      });
      addToast(response.data.message || 'Verification code sent.', 'success');
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Failed to resend verification code';
      setErrorMsg(message);
      addToast(message, 'error');
    } finally {
      setIsResending(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-xl">verified</span>
        </div>
        <h2 className="font-headline-sm text-headline-sm font-bold text-primary">Account Activated!</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Your account is verified. Redirecting to sign in...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {errorMsg && (
        <div className="p-4 bg-error-container/20 border border-error/20 text-error rounded-lg text-body-md font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-md">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="activate-email" className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide">
          Email Address
        </label>
        <input
          id="activate-email"
          type="email"
          required
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${inputClassName} font-bold`}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="activate-code" className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide">
          Verification code
        </label>
        <input
          id="activate-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          placeholder="Enter 6-digit code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className={`${inputClassName} uppercase text-center tracking-widest font-bold font-mono`}
        />
        <p className="font-label-md text-on-surface-variant mt-1">
          Check your inbox for a 6-digit code from PaysaSuchan. It expires in 15 minutes.
        </p>
      </div>

      <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
        {isSubmitting ? 'Verifying...' : 'Activate account'}
      </Button>

      <Button
        type="button"
        variant="secondary"
        className="w-full h-11"
        disabled={isResending}
        onClick={handleResend}
      >
        {isResending ? 'Sending...' : 'Resend verification code'}
      </Button>
    </form>
  );
}

export function ActivatePageWrapper() {
  return (
    <div className="flex flex-1 items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-on-primary mb-4 shadow-sm">
            <span className="material-symbols-outlined text-lg">verified_user</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-black tracking-tight text-primary">PaysaSuchan</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Verify your email</p>
        </div>

        <Card className="flex flex-col gap-6 bg-surface-container-lowest" glass={false}>
          <div>
            <h2 className="font-title-md text-title-md font-bold text-primary">Activate your account</h2>
            <p className="font-label-md text-label-md text-on-surface-variant mt-1">
              Enter the verification code we sent to your email after signup.
            </p>
          </div>

          <ActivateForm />
        </Card>
      </div>
    </div>
  );
}
