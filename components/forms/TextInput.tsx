import React from 'react';

export const INPUT_CLASS =
  'w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all text-on-surface';

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  error?: string;
  icon?: string;
  iconPosition?: 'left' | 'right';
}

export function TextInput({
  label,
  required,
  error,
  icon,
  iconPosition = 'left',
  className = '',
  ...props
}: TextInputProps) {
  const iconElement = icon ? (
    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
      {icon}
    </span>
  ) : null;

  const inputElement = (
    <>
      {icon && iconPosition === 'left' && iconElement}
      <input
        className={`${INPUT_CLASS} ${icon && iconPosition === 'left' ? 'pl-10' : ''} ${error ? 'border-error' : ''} ${className}`}
        {...props}
      />
      {icon && iconPosition === 'right' && iconElement}
    </>
  );

  if (label) {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide">
          {label} {required && <span className="text-error">*</span>}
        </label>
        <div className="relative">{inputElement}</div>
        {error && (
          <span className="text-error text-xs font-semibold mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">error</span>
            {error}
          </span>
        )}
      </div>
    );
  }

  return inputElement;
}
