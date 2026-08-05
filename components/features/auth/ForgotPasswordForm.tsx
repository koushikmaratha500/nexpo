'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

const inputClassName =
  'block w-full px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all text-on-surface';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center mb-4">
          <span className="material_symbols-outlined text-xl">mail</span>
        </div>
        <h2 className="font-headline-sm text-headline-sm font-bold text-primary">Recovery Email Sent!</h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">
          We have sent instructions to reset your password to <strong>{email}</strong>. Please check your inbox.
        </p>
        <Link href="/" className="mt-4 w-full">
          <Button variant="secondary" className="w-full">Return to Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-title-md text-title-md font-bold text-primary">Reset password</h2>
      <p className="font-label-md text-label-md text-on-surface-variant mt-1">
        Enter your email address and we&apos;ll send you recovery steps.
      </p>

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

        <Button type="submit" className="w-full h-11">
          Send Recovery Link
        </Button>
      </form>

      <div className="text-center text-label-md text-on-surface-variant mt-4">
        Remember your credentials?{' '}
        <Link href="/" className="text-primary font-bold hover:underline">
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
            <span className="material_symbols-outlined text-lg">corporate_fare</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-black tracking-tight text-primary">Corporate Pro Ledger</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Credentials Recovery</p>
        </div>

        <Card className="flex flex-col gap-6 bg-surface-container-lowest" glass={false}>
          <ForgotPasswordForm />
        </Card>
      </div>
    </div>
  );
}
