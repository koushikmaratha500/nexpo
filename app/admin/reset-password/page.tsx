'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import axios from 'axios';
import { useToast } from '@/hooks/useToast';
import { PasswordInput } from '@/components/forms/PasswordInput';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();

  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorMsg('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!token) {
      setErrorMsg('Invalid or missing reset token. Please request a new password reset link.');
      return;
    }

    if (password.length <= 6) {
      setErrorMsg('Password must be more than 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post('/api/admin/auth/reset-password', {
        token,
        password,
      });

      if (response.data?.success) {
        setSuccess(true);
        addToast('Password reset successfully. Please sign in.', 'success');
      } else {
        const errMsg = response.data?.error || 'Failed to reset password.';
        setErrorMsg(errMsg);
        addToast(errMsg, 'error');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to reset password. Please try again.';
      setErrorMsg(errMsg);
      addToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center min-h-screen bg-background p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-on-tertiary-container blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-secondary-container blur-3xl"></div>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-on-primary mb-4 shadow-sm">
            <span className="material-symbols-outlined text-lg">lock_reset</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-black tracking-tight text-primary">Corporate Pro Ledger</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Admin Password Reset</p>
        </div>

        <Card className="flex flex-col gap-6 bg-surface-container-lowest" glass={false}>
          {success ? (
            <div className="text-center py-8 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-xl">check</span>
              </div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-primary">Password Updated!</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Your admin credentials have been successfully updated. Please sign in with your new password.
              </p>
              <Link href="/admin/login" className="mt-4 w-full">
                <Button className="w-full">Go to Admin Login</Button>
              </Link>
            </div>
          ) : (
            <>
              <div>
                <h2 className="font-title-md text-title-md font-bold text-primary">Reset your password</h2>
                <p className="font-label-md text-label-md text-on-surface-variant mt-1">Define a new strong security credential for your admin workspace.</p>
              </div>

              {errorMsg && (
                <div className="p-4 bg-error-container/20 border border-error/20 text-error rounded-lg text-body-md font-medium flex items-center gap-2 animate-in fade-in duration-200">
                  <span className="material-symbols-outlined text-md">error</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <PasswordInput
                  id="pass"
                  label="New Password (min. 7 chars)"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <PasswordInput
                  id="confirmPass"
                  label="Confirm Password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <Button type="submit" disabled={isSubmitting || !token} className="w-full h-11">
                  {isSubmitting ? (
                    <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                  ) : (
                    'Update Admin Password'
                  )}
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-1 items-center justify-center min-h-screen bg-background p-4">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}