'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { PasswordInput } from '@/components/forms/PasswordInput';

const inputClassName =
  'px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all text-on-surface';

export function ForcedResetForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const emailInitialized = useRef(false);

  useEffect(() => {
    if (emailInitialized.current) return;
    emailInitialized.current = true;
    const pending = localStorage.getItem('nexpo_forced_reset_email') || '';
    setEmail(pending);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 7) {
      setErrorMsg('New password must be at least 7 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    const resetToken = localStorage.getItem('nexpo_forced_reset_token');
    if (!resetToken) {
      setErrorMsg('Your password reset session has expired. Please sign in again.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(
        '/api/user/auth/forced-reset',
        { newPassword },
        { headers: { Authorization: `Bearer ${resetToken}` } }
      );

      if (response.data.success) {
        const resToken = response.data.token;
        const rawUser = response.data.user;

        setAuth(
          {
            firstName: rawUser.firstName,
            lastName: rawUser.lastName || '',
            phone: rawUser.phone || rawUser.mobile || '',
            email: rawUser.email,
            countryId: rawUser.countryId || null,
            currencyId: rawUser.currencyId || null,
            role: 'CUSTOMER',
          },
          resToken
        );
        axios.defaults.headers.common['Authorization'] = `Bearer ${resToken}`;

        localStorage.removeItem('nexpo_forced_reset_token');
        localStorage.removeItem('nexpo_forced_reset_email');

        setSuccess(true);
        setTimeout(() => {
          router.push('/customer');
        }, 2000);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setErrorMsg(e.response?.data?.error || e.message || 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mb-4">
          <span className="material_symbols-outlined text-xl">verified</span>
        </div>
        <h2 className="font-headline-sm text-headline-sm font-bold text-primary">Password Updated!</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Your new credential is active. Redirecting to your dashboard...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {errorMsg && (
        <div className="p-4 bg-error-container/20 border border-error/20 text-error rounded-lg text-body-md font-medium flex items-center gap-2">
          <span className="material_symbols-outlined text-md">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="forced-reset-email" className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide">
          Account Email
        </label>
        <input
          id="forced-reset-email"
          type="email"
          readOnly
          value={email}
          className={`${inputClassName} font-bold opacity-80 cursor-not-allowed`}
        />
      </div>

      <PasswordInput
        id="forced-reset-password"
        label="New Password"
        required
        placeholder="At least 7 characters"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="font-bold"
      />

      <PasswordInput
        id="forced-reset-confirm"
        label="Confirm New Password"
        required
        placeholder="Re-enter new password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="font-bold"
      />

      <Button type="submit" disabled={isSubmitting} className="w-full h-11">
        {isSubmitting ? 'Updating...' : 'Set New Password'}
      </Button>

      <p className="text-center font-label-md text-label-md text-on-surface-variant">
        <Link href="/auth/login" className="text-primary font-semibold hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export function ForcedResetPageWrapper() {
  return (
    <div className="flex flex-1 items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-on-primary mb-4 shadow-sm">
            <span className="material_symbols-outlined text-lg">password</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-black tracking-tight text-primary">PaysaSuchan</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Credential Refresh Gateway</p>
        </div>

        <Card className="flex flex-col gap-6 bg-surface-container-lowest" glass={false}>
          <div>
            <h2 className="font-title-md text-title-md font-bold text-primary">Set a New Password</h2>
            <p className="font-label-md text-label-md text-on-surface-variant mt-1">
              An administrator has flagged your account to set a new credential before you can access the corporate ledger.
            </p>
          </div>

          <ForcedResetForm />
        </Card>
      </div>
    </div>
  );
}