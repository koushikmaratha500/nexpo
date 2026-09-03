'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/useToast';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthContext';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { BRAND_SUBTITLE } from '@/lib/brand/constants';
import { PasswordInput } from '@/components/forms/PasswordInput';
import { AuthSocialDivider, GoogleSignInButton } from '@/components/features/auth/GoogleSignInButton';

interface LoginFormProps {
  isAdmin?: boolean;
  onLoginSuccess?: () => void;
}

interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

const inputClassName =
  'block w-full px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all text-on-surface';

export function LoginForm({ isAdmin = false, onLoginSuccess }: LoginFormProps) {
  const { login, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  useEffect(() => {
    // Remove legacy plaintext password storage from older builds
    localStorage.removeItem('nexpo_saved_password');

    const savedRememberMe = localStorage.getItem('nexpo_remember_me');
    if (savedRememberMe === 'true') {
      setValue('rememberMe', true);
      const savedEmail = localStorage.getItem('nexpo_saved_email');
      if (savedEmail) setValue('email', savedEmail);
    }
  }, [setValue]);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/customer');
      }
    }
  }, [user, authLoading, router]);

  const onSubmit = async (data: LoginFormValues) => {
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const result = await login(data.email, data.password, isAdmin);
      if (result.success) {
        if (result.forcePasswordReset) {
          addToast('Please set a new password to continue.', 'warning');
          return;
        }
        addToast('Welcome back! Signed in successfully.', 'success');
        onLoginSuccess?.();

        if (data.rememberMe) {
          localStorage.setItem('nexpo_remember_me', 'true');
          localStorage.setItem('nexpo_saved_email', data.email);
        } else {
          localStorage.removeItem('nexpo_remember_me');
          localStorage.removeItem('nexpo_saved_email');
        }
        localStorage.removeItem('nexpo_saved_password');
      } else {
        const errMsg = result.error || 'Authentication failed.';
        if (result.pendingVerification) {
          addToast('Account pending verification. Redirecting to OTP activation page...', 'warning');
          router.push('/auth/activate');
        } else {
          setErrorMsg(errMsg);
          addToast(errMsg, 'error');
        }
      }
    } catch {
      setErrorMsg('An unexpected error occurred. Please try again.');
      addToast('An unexpected error occurred.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen bg-background p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-on-tertiary-container blur-3xl"></div>
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-secondary-container blur-3xl"></div>
        </div>
        <div className="w-full max-w-md z-10 animate-pulse">
          <div className="flex flex-col gap-4">
            <div className="h-10 w-full bg-surface-container-highest rounded-lg"></div>
            <div className="h-10 w-full bg-surface-container-highest rounded-lg"></div>
            <div className="h-11 w-full bg-surface-container-highest rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {errorMsg && (
        <div className="p-4 bg-error-container/20 border border-error/20 text-error rounded-lg text-body-md font-medium flex items-center gap-2 animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-md">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="login-email" className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide">
          {isAdmin ? 'Admin Email' : 'Email Address'}
        </label>
        <input
          id="login-email"
          type="email"
          placeholder={isAdmin ? 'admin@company.com' : 'name@company.com'}
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' },
          })}
          className={inputClassName}
        />
        {errors.email && (
          <span className="text-error text-xs font-semibold mt-1 flex items-center gap-1 animate-in slide-in-from-top-1">
            <span className="material-symbols-outlined text-xs">error</span>
            {errors.email.message}
          </span>
        )}
      </div>

      <PasswordInput
        id="login-password"
        label="Password"
        required
        placeholder="••••••••"
        error={errors.password?.message}
        labelRight={
          <Link
            href={isAdmin ? '/admin/forgot-password' : '/auth/forgot-password'}
            className="font-label-md text-label-md text-on-primary-container hover:underline"
          >
            Forgot password?
          </Link>
        }
        {...register('password', {
          required: 'Password is required',
          minLength: { value: 6, message: 'Password must be at least 6 characters' },
        })}
      />

      {!isAdmin && (
        <div className="flex items-center gap-2">
          <input
            id="login-remember-me"
            type="checkbox"
            {...register('rememberMe')}
            className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary accent-primary cursor-pointer"
          />
          <label htmlFor="login-remember-me" className="font-label-md text-label-md text-on-surface-variant font-bold cursor-pointer select-none">
            Remember me
          </label>
        </div>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full h-11">
        {isSubmitting ? (
          <span className="material-symbols-outlined animate-spin text-sm">sync</span>
        ) : isAdmin ? (
          'Sign In to Admin'
        ) : (
          'Sign In'
        )}
      </Button>
    </form>
  );
}

export function LoginPageWrapper({ isAdmin = false }: { isAdmin?: boolean }) {
  const { addToast } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    if (error === 'google_auth_failed') {
      addToast('Google sign-in failed. Please try again.', 'error');
    }
  }, [addToast]);

  return (
    <div className="flex flex-1 items-center justify-center min-h-screen bg-background p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-on-tertiary-container blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-secondary-container blur-3xl"></div>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BrandLogo variant="full" theme="mono" size="lg" />
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            {isAdmin ? 'Administrative Access Portal' : BRAND_SUBTITLE}
          </p>
        </div>

        <Card className="flex flex-col gap-6 bg-surface-container-lowest" glass={false}>
          <div>
            <h2 className="font-title-md text-title-md font-bold text-primary">
              {isAdmin ? 'Admin Sign In' : 'Sign in to account'}
            </h2>
            <p className="font-label-md text-label-md text-on-surface-variant mt-1">
              Sign in with Google or your email and password.
            </p>
          </div>

          {!isAdmin && (
            <>
              <GoogleSignInButton />
              <AuthSocialDivider />
            </>
          )}

          <LoginForm isAdmin={isAdmin} />

          {!isAdmin && (
            <div className="text-center text-label-md text-on-surface-variant">
              Need an account?{' '}
              <Link href="/auth/register" className="text-primary font-bold hover:underline">
                Register here
              </Link>
            </div>
          )}

          {isAdmin && (
            <div className="text-center text-label-md text-on-surface-variant">
              Return to{' '}
              <Link href="/auth/login" className="text-primary font-bold hover:underline">
                Customer Login
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
