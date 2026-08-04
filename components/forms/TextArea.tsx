import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  required?: boolean;
  error?: string;
}

export function TextArea({ label, required, error, className = '', ...props }: TextAreaProps) {
  const baseClass =
    'w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all text-on-surface resize-none';

  if (!label) {
    return (
      <textarea
        className={`${baseClass} ${error ? 'border-error' : ''} ${className}`}
        {...props}
      />
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide">
        {label} {required && <span className="text-error">*</span>}
      </label>
      <textarea
        className={`${baseClass} ${error ? 'border-error' : ''} ${className}`}
        {...props}
      />
      {error && (
        <span className="text-error text-xs font-semibold mt-1 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">error</span>
          {error}
        </span>
      )}
    </div>
  );
}
