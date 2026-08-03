'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import axios from 'axios';
import { useToast } from '@/hooks/useToast';

export default function AdminForgotPasswordPage() {
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoadingMail, setIsLoadingMail] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoadingMail(true);

    try {
      const response = await axios.post('/api/admin/auth/forgot-password', { email });
      if (response.data?.success) {
        setSubmitted(true);
        addToast('Password reset link sent to your email.', 'success');
      } else {
        setErrorMsg(response.data?.error || 'Failed to send recovery email.');
        addToast('Failed to send recovery email.', 'error');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to send recovery email. Please try again.';
      setErrorMsg(errMsg);
      addToast(errMsg, 'error');
    } finally {
      setIsLoadingMail(false);
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
            <span className="material-symbols-outlined text-lg">shield_person</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-black tracking-tight text-primary">Corporate Pro Ledger</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Admin Credentials Recovery</p>
        </div>

        <Card className="flex flex-col gap-6 bg-surface-container-lowest" glass={false}>
          {submitted ? (
            <div className="text-center py-8 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-xl">mark_email_read</span>
              </div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-primary">Recovery Email Sent!</h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">
                We have sent instructions to reset your admin password to <strong>{email}</strong>. Please check your inbox.
              </p>
              <Link href="/admin/login" className="mt-4 w-full">
                <Button variant="secondary" className="w-full">Return to Admin Login</Button>
              </Link>
            </div>
          ) : (
            <>
              <div>
                <h2 className="font-title-md text-title-md font-bold text-primary">Reset Admin Password</h2>
                <p className="font-label-md text-label-md text-on-surface-variant mt-1">
                  Enter your admin email address and we'll send you recovery steps.
                </p>
              </div>

              {errorMsg && (
                <div className="p-4 bg-error-container/20 border border-error/20 text-error rounded-lg text-body-md font-medium flex items-center gap-2 animate-in fade-in duration-200">
                  <span className="material-symbols-outlined text-md">error</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="email" className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide">
                    Admin Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="admin@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all text-on-surface"
                  />
                </div>

                <Button type="submit" disabled={isLoadingMail} className="w-full h-11">
                  {isLoadingMail ? (
                    <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                  ) : (
                    'Send Recovery Link'
                  )}
                </Button>
              </form>

              <div className="text-center text-label-md text-on-surface-variant">
                Remember your credentials?{' '}
                <Link href="/admin/login" className="text-primary font-bold hover:underline">
                  Sign in
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}