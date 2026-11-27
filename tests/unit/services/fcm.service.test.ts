import { generateKeyPairSync } from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FcmService } from '@/lib/api/services/fcm.service';
import { MobilePushTokenRepository } from '@/lib/api/repositories/mobile-push-token.repository';
import { isValidSealKey, sealToken } from '@/lib/auth/mobileOAuth';

vi.mock('@/lib/api/repositories/mobile-push-token.repository', () => ({
  MobilePushTokenRepository: { deleteToken: vi.fn() },
}));

describe('FcmService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({
      project_id: 'demo',
      client_email: 'push@demo.iam.gserviceaccount.com',
      private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }),
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    vi.clearAllMocks();
  });

  it('is off without a service account', () => {
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    expect(FcmService.isConfigured()).toBe(false);
  });

  it('sends to each token and drops tokens FCM no longer knows', async () => {
    global.fetch = vi.fn(async (url: string, init: RequestInit) => {
      if (url.includes('oauth2')) return new Response(JSON.stringify({ access_token: 'at', expires_in: 3600 }));
      const token = JSON.parse(String(init.body)).message.token;
      return new Response('{}', { status: token === 'stale' ? 404 : 200 });
    }) as never;

    const result = await FcmService.send(['good', 'stale'], { title: 'Rent due', body: 'Today', data: { reminderId: 'r1' } });

    expect(result.sent).toBe(1);
    expect(MobilePushTokenRepository.deleteToken).toHaveBeenCalledWith('stale');
    expect(MobilePushTokenRepository.deleteToken).toHaveBeenCalledTimes(1);
  });
});

describe('sealToken', () => {
  it('matches the Flutter TokenSeal vector and hides the token', () => {
    const zeroKey = Buffer.alloc(32).toString('base64url');
    expect(isValidSealKey(zeroKey)).toBe(true);
    expect(isValidSealKey('short')).toBe(false);
    expect(sealToken('hello', zeroKey)).toBe('T4lwAgM');
    expect(sealToken('eyJhbGciOiJIUzI1NiJ9.payload', zeroKey)).not.toContain('eyJ');
  });
});
