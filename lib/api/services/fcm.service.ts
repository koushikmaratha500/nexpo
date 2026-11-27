import { createSign } from 'crypto';
import { MobilePushTokenRepository } from '../repositories/mobile-push-token.repository';
import type { PushPayload } from './push.service';

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

let cachedAccess: { token: string; expiresAt: number } | null = null;

function serviceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ServiceAccount>;
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) return null;
    return parsed as ServiceAccount;
  } catch {
    return null;
  }
}

/** OAuth access token for the FCM HTTP v1 API, from the service account (cached ~1 hour). */
async function accessToken(account: ServiceAccount): Promise<string> {
  if (cachedAccess && cachedAccess.expiresAt > Date.now() + 60_000) return cachedAccess.token;
  const now = Math.floor(Date.now() / 1000);
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })}`;
  const signature = createSign('RSA-SHA256').update(unsigned).sign(account.private_key, 'base64url');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`,
    }),
  });
  if (!response.ok) throw new Error(`FCM auth failed: ${response.status}`);
  const json = (await response.json()) as { access_token: string; expires_in: number };
  cachedAccess = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

/** Push to the Android/iOS app through Firebase Cloud Messaging (the app registers its FCM token). */
export class FcmService {
  static isConfigured(): boolean {
    return serviceAccount() !== null;
  }

  static async send(tokens: string[], payload: PushPayload): Promise<{ sent: number }> {
    const account = serviceAccount();
    if (!account || tokens.length === 0) return { sent: 0 };
    const bearer = await accessToken(account);
    const url = `https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`;

    const results = await Promise.allSettled(
      tokens.map(async (token) => {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bearer}` },
          body: JSON.stringify({
            message: {
              token,
              notification: { title: payload.title, body: payload.body },
              data: { ...(payload.data ?? {}), ...(payload.url ? { url: payload.url } : {}) },
              android: { notification: { channel_id: 'ps_push' } },
            },
          }),
        });
        if (response.ok) return true;
        // 404 UNREGISTERED: app uninstalled or token rotated. (400 can be a payload bug, so keep the token.)
        if (response.status === 404) {
          await MobilePushTokenRepository.deleteToken(token);
        }
        return false;
      }),
    );
    return { sent: results.filter((r) => r.status === 'fulfilled' && r.value).length };
  }
}
