import React from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  required,
  error,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide">
        {label} {required && <span className="text-error">*</span>}
      </label>
      {children}
      {error && (
        <span className="text-error text-xs font-semibold mt-1 flex items-center gap-1 animate-in slide-in-from-top-1">
          <span className="material-symbols-outlined text-xs">error</span>
          {error}
        </span>
      )}
    </div>
  );
}
