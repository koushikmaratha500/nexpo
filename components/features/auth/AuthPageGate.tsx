'use client';

import React from 'react';
import { useAuth } from '@/components/auth/AuthContext';

export function AuthLoadingSkeleton() {
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

export function AuthPageGate({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <AuthLoadingSkeleton />;
  }

  return <>{children}</>;
}
