import { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { HttpError } from './errorHandler';
import { getKvClient, isProductionEnv, isRedisConfigured } from '../utils/redisClient';

const memoryStore = new Map<string, { count: number; resetAt: number }>();

const ratelimitInstances = new Map<string, Ratelimit>();

function getRatelimit(limit: number, windowSeconds: number): Ratelimit | null {
  const client = getKvClient();
  if (!client) return null;

  const key = `${limit}_${windowSeconds}`;
  let instance = ratelimitInstances.get(key);
  if (!instance) {
    instance = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      analytics: true,
      prefix: `nexpo_ratelimit_${limit}_${windowSeconds}`,
    });
    ratelimitInstances.set(key, instance);
  }
  return instance;
}

export const RATE_LIMIT_PRESETS = {
  default: { limit: 50, windowSeconds: 60 },
  login: { limit: 10, windowSeconds: 60 },
  register: { limit: 5, windowSeconds: 60 },
  verify: { limit: 10, windowSeconds: 60 },
  resendOtp: { limit: 5, windowSeconds: 300 },
  support: { limit: 20, windowSeconds: 60 },
  transactionWrite: { limit: 30, windowSeconds: 60 },
  adminUserWrite: { limit: 20, windowSeconds: 60 },
  adminForgotPassword: { limit: 5, windowSeconds: 60 },
  adminResetPassword: { limit: 5, windowSeconds: 60 },
  userForgotPassword: { limit: 5, windowSeconds: 60 },
  userResetPassword: { limit: 5, windowSeconds: 60 },
  aiChat: { limit: 20, windowSeconds: 60 },
  aiOcr: { limit: 10, windowSeconds: 60 },
  aiInsights: { limit: 10, windowSeconds: 60 },
  groupInvite: { limit: 20, windowSeconds: 60 },
  shareCreate: { limit: 20, windowSeconds: 86400 },
  sharePublic: { limit: 60, windowSeconds: 60 },
  upload: { limit: 20, windowSeconds: 60 },
} as const;

export interface RateLimitOptions {
  limit?: number;
  windowSeconds?: number;
}

function applyMemoryRateLimit(identifier: string, limit: number, windowSeconds: number): boolean {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const record = memoryStore.get(identifier);

  if (!record || now > record.resetAt) {
    memoryStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count += 1;
  return true;
}

export async function checkRateLimit(
  req: NextRequest,
  identifier: string,
  options: RateLimitOptions = {},
): Promise<void> {
  const limit = options.limit ?? RATE_LIMIT_PRESETS.default.limit;
  const windowSeconds = options.windowSeconds ?? RATE_LIMIT_PRESETS.default.windowSeconds;
  const instance = getRatelimit(limit, windowSeconds);

  if (instance) {
    try {
      const result = await instance.limit(identifier);
      if (!result.success) {
        throw new HttpError(429, 'Too many requests. Please try again later.');
      }
      return;
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      console.error('Rate limit redis error:', error);
      if (isProductionEnv()) {
        throw new HttpError(503, 'Rate limiting temporarily unavailable.');
      }
    }
  } else if (isProductionEnv()) {
    if (!isRedisConfigured()) {
      throw new HttpError(503, 'Rate limiting is not configured.');
    }
    throw new HttpError(503, 'Rate limiting temporarily unavailable.');
  }

  const allowed = applyMemoryRateLimit(identifier, limit, windowSeconds);
  if (!allowed) {
    throw new HttpError(429, 'Too many requests. Please try again later.');
  }
}

export function getRequestIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous';
}
