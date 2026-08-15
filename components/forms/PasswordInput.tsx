'use client';

import React, { useState } from 'react';

export const PASSWORD_INPUT_CLASS =
  'w-full px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all text-on-surface';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  error?: string;
  showToggle?: boolean;
  labelRight?: React.ReactNode;
}

export function PasswordInput({
  label,
  required,
  error,
  showToggle = true,
  labelRight,
  id,
  className = '',
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const input = (
    <>
      <input
        id={id}
        type={showPassword ? 'text' : 'password'}
        required={required}
        className={`${PASSWORD_INPUT_CLASS} ${showToggle ? 'pr-12' : ''} ${error ? 'border-error' : ''} ${className}`}
        {...props}
      />
      {showToggle && (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          aria-pressed={showPassword}
        >
          <span className="material-symbols-outlined text-xs scale-90">
            {showPassword ? 'visibility_off' : 'visibility'}
          </span>
        </button>
      )}
    </>
  );

  if (label) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={id} className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide">
            {label} {required && <span className="text-error">*</span>}
          </label>
          {labelRight}
        </div>
        <div className="relative w-full">{input}</div>
        {error && (
          <span className="text-error text-xs font-semibold mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">error</span>
            {error}
          </span>
        )}
      </div>
    );
  }

  return <div className="relative w-full">{input}</div>;
}
