import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { applySecurityHeaders } from '@/lib/security/responseHeaders';
import { sanitizeMarkdownHref } from '@/lib/markdown/sanitizeLink';
import { OtpService } from '@/lib/api/services/otp.service';
import { HttpError } from '@/lib/api/middleware/errorHandler';
import { clearMemoryKvStore } from '@/lib/api/utils/redisClient';

beforeEach(() => {
  vi.resetModules();
  clearMemoryKvStore();
  vi.stubEnv('NODE_ENV', 'development');
  vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
  vi.stubEnv('KV_REST_API_URL', '');
  vi.stubEnv('KV_REST_API_TOKEN', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

async function loadMemoryRateLimiter() {
  vi.resetModules();
  return import('@/lib/api/middleware/rateLimiter');
}

describe('P4 auth & infrastructure hardening', () => {
  describe('P4-T1 OTP generation', () => {
    it('returns unpredictable 6-digit numeric codes', () => {
      const codes = new Set(Array.from({ length: 20 }, () => OtpService.generateOtp()));
      expect(codes.size).toBeGreaterThan(1);
      for (const code of codes) {
        expect(code).toMatch(/^\d{6}$/);
        expect(Number(code)).toBeGreaterThanOrEqual(100000);
        expect(Number(code)).toBeLessThanOrEqual(999999);
      }
    });
  });

  describe('P4-T2/P4-T3 OTP verify flow', () => {
    it('verifies a valid OTP and clears it', async () => {
      const code = await OtpService.createOtp('user@example.com', false);
      await expect(OtpService.verifyOtp('user@example.com', code)).resolves.toBe(true);
      await expect(OtpService.verifyOtp('user@example.com', code)).resolves.toBe(false);
    });

    it('locks after five failed attempts', async () => {
      await OtpService.createOtp('locked@example.com', false);

      for (let i = 0; i < 4; i += 1) {
        await expect(OtpService.verifyOtp('locked@example.com', '000000')).resolves.toBe(false);
      }

      let thrown: unknown;
      try {
        await OtpService.verifyOtp('locked@example.com', '000000');
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeInstanceOf(HttpError);
      expect((thrown as HttpError).status).toBe(429);
    });
  });

  describe('P4-T4 security headers', () => {
    it('applies baseline security headers', () => {
      const response = applySecurityHeaders(NextResponse.next());
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
      expect(response.headers.get('Content-Security-Policy')).toContain("frame-ancestors 'none'");
      expect(response.headers.get('Content-Security-Policy')).toContain('https://fonts.googleapis.com');
      expect(response.headers.get('Content-Security-Policy')).toContain('https://fonts.gstatic.com');
    });
  });

  describe('P4-T5 markdown link sanitization', () => {
    it('blocks javascript and data URLs', () => {
      expect(sanitizeMarkdownHref('javascript:alert(1)')).toBeUndefined();
      expect(sanitizeMarkdownHref('data:text/html,<script>alert(1)</script>')).toBeUndefined();
    });

    it('keeps safe https links and upgrades protocol-relative URLs', () => {
      expect(sanitizeMarkdownHref('https://example.com')).toBe('https://example.com');
      expect(sanitizeMarkdownHref('//example.com/path')).toBe('https://example.com/path');
    });
  });

  describe('P4-T6 rate limiting', () => {
    it('allows memory fallback in development', async () => {
      const { checkRateLimit } = await loadMemoryRateLimiter();
      const req = new NextRequest('http://localhost/api/user/transaction', { method: 'POST' });
      await expect(
        checkRateLimit(req, 'txn_write:test-user', { limit: 2, windowSeconds: 60 }),
      ).resolves.toBeUndefined();
    });

    it('fail-closes in production when redis is not configured', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      const { checkRateLimit } = await loadMemoryRateLimiter();
      const req = new NextRequest('http://localhost/api/user/transaction', { method: 'POST' });

      await expect(
        checkRateLimit(req, 'txn_write:test-user', { limit: 2, windowSeconds: 60 }),
      ).rejects.toMatchObject({ status: 503 });
    });

    it('returns 429 after threshold in development memory mode', async () => {
      const { checkRateLimit } = await loadMemoryRateLimiter();
      const req = new NextRequest('http://localhost/api/user/transaction', { method: 'POST' });

      await checkRateLimit(req, 'txn_write:burst-user', { limit: 2, windowSeconds: 60 });
      await checkRateLimit(req, 'txn_write:burst-user', { limit: 2, windowSeconds: 60 });

      await expect(
        checkRateLimit(req, 'txn_write:burst-user', { limit: 2, windowSeconds: 60 }),
      ).rejects.toMatchObject({ status: 429 });
    });
  });

  describe('P4-T6 seed safety', () => {
    it('does not embed plaintext passwords in seed script comments', async () => {
      const { readFileSync } = await import('node:fs');
      const path = await import('node:path');
      const seed = readFileSync(path.resolve(__dirname, '../../prisma/seed.ts'), 'utf8');
      expect(seed).not.toMatch(/\/\/.*password/i);
      expect(seed).toContain("process.env.SEED_DEMO_DATA !== 'true'");
    });
  });
});
