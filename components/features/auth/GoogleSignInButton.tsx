'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/useToast';

function GoogleIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function AuthSocialDivider() {
  return (
    <div className="relative my-1 flex items-center gap-3">
      <div className="h-px flex-1 bg-outline-variant/50" />
      <span className="font-label-md text-label-md font-bold uppercase tracking-wider text-on-surface-variant">
        or
      </span>
      <div className="h-px flex-1 bg-outline-variant/50" />
    </div>
  );
}

export function GoogleSignInButton() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/auth/callback/complete`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        addToast(error.message || 'Could not start Google sign-in', 'error');
        setLoading(false);
      }
    } catch {
      addToast('Could not start Google sign-in', 'error');
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      className="h-11 w-full rounded-full border-outline-variant bg-surface-container-lowest"
      onClick={handleGoogleSignIn}
      disabled={loading}
    >
      {loading ? (
        <span className="material-symbols-outlined animate-spin text-sm">sync</span>
      ) : (
        <>
          <GoogleIcon />
          Continue with Google
        </>
      )}
    </Button>
  );
}
