'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { BrandLogo } from '@/components/brand/BrandLogo';

export default function GoogleCallbackCompletePage() {
  const { completeGoogleLogin } = useAuth();
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      const result = await completeGoogleLogin();
      if (!result.success) {
        router.replace(`/auth/login?error=${encodeURIComponent(result.error ?? 'google_auth_failed')}`);
      }
    })();
  }, [completeGoogleLogin, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-md bg-background px-lg text-center">
      <BrandLogo variant="full" theme="mono" />
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      <p className="font-body-md text-on-surface-variant">Completing Google sign-in…</p>
    </div>
  );
}
