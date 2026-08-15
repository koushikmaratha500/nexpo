'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/useToast';
import Link from 'next/link';
import axios from 'axios';
import { PasswordInput } from '@/components/forms/PasswordInput';

interface RegisterFormValues {
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  password: string;
}

const inputClassName =
  'w-full px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all text-on-surface';

export function RegisterForm() {
  const { addToast } = useToast();
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      country: 'India',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setErrorMsg('');
    setIsSubmitting(true);

    if (data.password.length < 7) {
      setErrorMsg('Password must be at least 7 characters long.');
      addToast('Password must be at least 7 characters.', 'error');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.post('/api/user/auth/register', {
        firstName: data.firstName,
        lastName: data.lastName || '',
        email: data.email,
        password: data.password,
        country: data.country,
      });

      if (response.data.success) {
        addToast('Registration successful! OTP sent to email.', 'success');
        localStorage.setItem('nexpo_pending_email', data.email);
        setSuccess(true);
        setTimeout(() => {
          window.location.href = '/auth/activate';
        }, 1500);
      }
    } catch (err: unknown) {
      const errMsg = (err as { response?: { data?: { error?: string } }; message?: string }).response?.data?.error || (err as { message?: string }).message || 'Registration failed';
      setErrorMsg(errMsg);
      addToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mb-4">
          <span className="material_symbols-outlined text-xl">check_circle</span>
        </div>
        <h2 className="font-headline-sm text-headline-sm font-bold text-primary">Registration Requested!</h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">
          Your request is pending administrator authorization. Redirecting to login...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {errorMsg && (
        <div className="p-4 bg-error-container/20 border border-error/20 text-error rounded-lg text-body-md font-medium flex items-center gap-2 animate-in fade-in duration-200">
          <span className="material_symbols-outlined text-md">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="register-first-name" className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide">
            First Name
          </label>
          <input
            id="register-first-name"
            type="text"
            placeholder="Jane"
            {...register('firstName', { required: 'First name is required' })}
            className={inputClassName}
          />
          {errors.firstName && (
            <span className="text-error text-xs font-semibold mt-1 flex items-center gap-1 animate-in slide-in-from-top-1">
              <span className="material_symbols-outlined text-xs">error</span>
              {errors.firstName.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="register-last-name" className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide">
            Last Name
          </label>
          <input
            id="register-last-name"
            type="text"
            placeholder="Sterling"
            {...register('lastName')}
            className={inputClassName}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="register-email" className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide">
          Email Address
        </label>
        <input
          id="register-email"
          type="email"
          placeholder="name@company.com"
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' },
          })}
          className={inputClassName}
        />
        {errors.email && (
          <span className="text-error text-xs font-semibold mt-1 flex items-center gap-1 animate-in slide-in-from-top-1">
            <span className="material_symbols-outlined text-xs">error</span>
            {errors.email.message}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="register-country" className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide">
          Country
        </label>
        <div className="relative">
          <select
            id="register-country"
            {...register('country')}
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
          <span className="material_symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
        </div>
      </div>

      <PasswordInput
        id="register-password"
        label="Password (min. 7 chars)"
        required
        placeholder="••••••••"
        error={errors.password?.message}
        {...register('password', {
          required: 'Password is required',
          minLength: { value: 7, message: 'Password must be at least 7 characters' },
        })}
      />

      <Button type="submit" disabled={isSubmitting} className="w-full h-11">
        {isSubmitting ? (
          <span className="material_symbols-outlined animate-spin text-sm">sync</span>
        ) : (
          'Register'
        )}
      </Button>
    </form>
  );
}

export function RegisterPageWrapper() {
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
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Enterprise Registration Hub</p>
        </div>

        <Card className="flex flex-col gap-6 bg-surface-container-lowest" glass={false}>
          <div>
            <h2 className="font-title-md text-title-md font-bold text-primary">Create an account</h2>
            <p className="font-label-md text-label-md text-on-surface-variant mt-1">Fill in your information to join your organization.</p>
          </div>

          <RegisterForm />

          <div className="text-center text-label-md text-on-surface-variant">
            Already registered?{' '}
            <Link href="/" className="text-primary font-bold hover:underline">
              Sign in instead
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
