import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
}

export function Card({ children, className = '', glass = true, ...props }: CardProps) {
  // Check if a padding utility is specified in the custom className
  const hasPadding = className.split(' ').some(cls => 
    cls.startsWith('p-') || 
    cls.startsWith('px-') || 
    cls.startsWith('py-') || 
    cls.startsWith('pt-') || 
    cls.startsWith('pb-') || 
    cls.startsWith('pl-') || 
    cls.startsWith('pr-')
  );

  return (
    <div
      className={`${
        glass ? 'glass-card' : 'bg-surface-container-lowest border border-outline-variant'
      } ${hasPadding ? '' : 'p-6'} rounded-xl shadow-sm transition-all duration-300 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
