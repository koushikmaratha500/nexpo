'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function BlockedPage() {
  return (
    <div className="flex flex-1 items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="text-center p-8 flex flex-col items-center gap-4 bg-surface-container-lowest" glass={false}>
          <div className="w-16 h-16 rounded-full bg-error-container text-on-error-container flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-xl">block</span>
          </div>
          <h1 className="font-headline-sm text-headline-sm font-black text-primary">Account Blocked</h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-xs leading-relaxed">
            Your login request has been denied. This account has been locked or suspended by the system administrator.
          </p>
          <p className="font-label-md text-label-md text-on-surface-variant/70 border-t border-outline-variant pt-4 w-full">
            If you believe this is an error, please contact your company IT administrator.
          </p>
          <Link href="/auth/login" className="mt-4 w-full">
            <Button variant="secondary" className="w-full">Back to Login</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
