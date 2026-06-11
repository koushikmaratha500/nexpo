import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  className?: string;
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonProps) {
  const baseStyle = 'flex items-center justify-center gap-1 px-4 py-2 rounded-lg font-title-md text-title-md transition-all active:scale-95 duration-200 select-none cursor-pointer';
  
  const variants = {
    primary: 'bg-primary text-on-primary hover:opacity-90 shadow-sm',
    secondary: 'border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low',
    ghost: 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low',
    danger: 'bg-error text-on-error hover:opacity-90 shadow-sm',
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
