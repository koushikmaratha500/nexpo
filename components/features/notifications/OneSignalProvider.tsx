'use client';

import { useEffect } from 'react';
import axios from 'axios';

declare global {
  interface Window {
    OneSignalDeferred?: Array<(oneSignal: OneSignalClient) => void | Promise<void>>;
    OneSignal?: OneSignalClient;
  }
}

interface OneSignalClient {
  init(options: { appId: string; allowLocalhostAsSecureOrigin?: boolean }): Promise<void>;
  Notifications: {
    isPushSupported(): boolean;
    permission: boolean;
    requestPermission(): Promise<boolean>;
    addEventListener(event: string, listener: (event: { current?: { id?: string } }) => void): void;
  };
  User: {
    PushSubscription: {
      id?: string | null;
      optIn(): Promise<void>;
    };
    addAlias(label: string, id: string): Promise<void>;
  };
}

export function OneSignalProvider({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

  useEffect(() => {
    if (!appId || typeof window === 'undefined') return;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      await OneSignal.init({
        appId,
        allowLocalhostAsSecureOrigin: true,
      });

      const supported = OneSignal.Notifications.isPushSupported();
      if (!supported) return;

      OneSignal.Notifications.addEventListener('click', () => {
        window.focus();
      });

      OneSignal.Notifications.addEventListener('subscriptionChange', async (event) => {
        const playerId = event.current?.id || OneSignal.User.PushSubscription.id;
        if (!playerId) return;
        try {
          await axios.post('/api/user/notifications/push/register', {
            playerId,
            platform: 'WEB',
          });
        } catch {
          // Registration can fail if push is disabled globally — ignore silently
        }
      });
    });

    if (document.getElementById('onesignal-sdk')) return;

    const script = document.createElement('script');
    script.id = 'onesignal-sdk';
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.defer = true;
    document.head.appendChild(script);
  }, [appId]);

  return <>{children}</>;
}

export async function promptOneSignalOptIn(externalUserId?: string) {
  if (!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || !window.OneSignal) {
    return { granted: false, playerId: null as string | null };
  }

  const OneSignal = window.OneSignal;
  if (!OneSignal.Notifications.isPushSupported()) {
    return { granted: false, playerId: null };
  }

  const granted = await OneSignal.Notifications.requestPermission();
  if (!granted) {
    return { granted: false, playerId: null };
  }

  await OneSignal.User.PushSubscription.optIn();
  if (externalUserId) {
    await OneSignal.User.addAlias('external_id', externalUserId);
  }

  const playerId = OneSignal.User.PushSubscription.id;
  if (playerId) {
    await axios.post('/api/user/notifications/push/register', {
      playerId,
      platform: 'WEB',
    });
  }

  return { granted: true, playerId: playerId || null };
}
