'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { isLoading } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('India');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    if (password.length <= 6) {
      setErrorMsg('Password must be more than 6 characters long.');
      setIsSubmitting(false);
      return;
    }

    // Success simulation
    setSuccess(true);
    setTimeout(() => {
      router.push('/');
    }, 3000);
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
              {/* Name fields split skeleton */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-20 bg-surface-container-high rounded"></div>
                  <div className="h-10 w-full bg-surface-container-low rounded-lg border border-outline-variant/30"></div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-20 bg-surface-container-high rounded"></div>
                  <div className="h-10 w-full bg-surface-container-low rounded-lg border border-outline-variant/30"></div>
                </div>
              </div>

              {/* Email field skeleton */}
              <div className="flex flex-col gap-2">
                <div className="h-4 w-28 bg-surface-container-high rounded"></div>
                <div className="h-10 w-full bg-surface-container-low rounded-lg border border-outline-variant/30"></div>
              </div>

              {/* Country select skeleton */}
              <div className="flex flex-col gap-2">
                <div className="h-4 w-20 bg-surface-container-high rounded"></div>
                <div className="h-10 w-full bg-surface-container-low rounded-lg border border-outline-variant/30"></div>
              </div>

              {/* Password field skeleton */}
              <div className="flex flex-col gap-2">
                <div className="h-4 w-32 bg-surface-container-high rounded"></div>
                <div className="h-10 w-full bg-surface-container-low rounded-lg border border-outline-variant/30"></div>
              </div>

              {/* Button skeleton */}
              <div className="h-11 w-full bg-surface-container-highest rounded-lg"></div>
            </div>

            {/* Footer link skeleton */}
            <div className="flex justify-center">
              <div className="h-4 w-44 bg-surface-container-high rounded"></div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

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
          <h1 className="font-headline-lg text-headline-lg font-black tracking-tight text-primary">Corporate Pro Ledger</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Enterprise Registration Hub</p>
        </div>

        <Card className="flex flex-col gap-6 bg-surface-container-lowest" glass={false}>
          {success ? (
            <div className="text-center py-8 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-xl">check_circle</span>
              </div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-primary">Registration Requested!</h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">
                Your request is pending administrator authorization. Redirecting to login...
              </p>
            </div>
          ) : (
            <>
              <div>
                <h2 className="font-title-md text-title-md font-bold text-primary">Create an account</h2>
                <p className="font-label-md text-label-md text-on-surface-variant mt-1">Fill in your information to join your organization.</p>
              </div>

              {errorMsg && (
                <div className="p-4 bg-error-container/20 border border-error/20 text-error rounded-lg text-body-md font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-md">error</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="firstName" className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      required
                      placeholder="Jane"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all text-on-surface w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="lastName" className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      placeholder="Sterling"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all text-on-surface w-full"
                    />
                  </div>
                </div>

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
                  <label htmlFor="country" className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide">
                    Country
                  </label>
                  <div className="relative">
                    <select
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all text-on-surface appearance-none font-bold"
                    >
                      <option value="India">India</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Germany">Germany</option>
                      <option value="Japan">Japan</option>
                      <option value="Singapore">Singapore</option>
                      <option value="Canada">Canada</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="password" className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide">
                    Password (min. 7 chars)
                  </label>
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

                <Button type="submit" disabled={isSubmitting} className="w-full h-11">
                  {isSubmitting ? (
                    <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                  ) : (
                    'Register'
                  )}
                </Button>
              </form>

              <div className="text-center text-label-md text-on-surface-variant">
                Already registered?{' '}
                <Link href="/" className="text-primary font-bold hover:underline">
                  Sign in instead
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
