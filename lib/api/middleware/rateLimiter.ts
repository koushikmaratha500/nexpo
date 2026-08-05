import { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { kv } from '@vercel/kv';
import { HttpError } from './errorHandler';

// Simple in-memory fallback
const memoryStore = new Map<string, { count: number; resetAt: number }>();

const isUpstashConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const isKvConfigured = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

let ratelimit: Ratelimit | null = null;

if (isUpstashConfigured) {
  try {
    const redis = Redis.fromEnv();
    ratelimit = new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(50, '60 s'),
      analytics: true,
      prefix: 'nexpo_ratelimit',
    });
    console.log('Upstash Redis initialized for Rate Limiting');
  } catch (error) {
    console.warn('Failed to initialize Upstash Redis, checking Vercel KV fallback:', error);
  }
}

if (!ratelimit && isKvConfigured) {
  try {
    ratelimit = new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(50, '60 s'),
      analytics: true,
      prefix: 'nexpo_ratelimit',
    });
    console.log('Vercel KV initialized for Rate Limiting');
  } catch (error) {
    console.warn('Failed to initialize Vercel KV, using memory fallback:', error);
  }
}

export async function checkRateLimit(req: NextRequest, identifier: string): Promise<void> {
  let success = true;
  let limit = 50;
  let remaining = 50;
  let reset = Date.now() + 60000;

  if (ratelimit) {
    try {
      const result = await ratelimit.limit(identifier);
      success = result.success;
      limit = result.limit;
      remaining = result.remaining;
      reset = result.reset;
    } catch (error) {
      console.error('Rate limit redis error, falling back to memory store:', error);
    }
  }

  if (!ratelimit || !success) {
    // Fallback to in-memory rate limiting
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute

    const record = memoryStore.get(identifier);
    if (!record || now > record.resetAt) {
      const newRecord = { count: 1, resetAt: now + windowMs };
      memoryStore.set(identifier, newRecord);
      remaining = limit - 1;
      reset = newRecord.resetAt;
    } else {
      if (record.count >= limit) {
        success = false;
        remaining = 0;
        reset = record.resetAt;
      } else {
        record.count += 1;
        remaining = limit - record.count;
        reset = record.resetAt;
      }
    }
  }

  if (!success) {
    throw new HttpError(429, 'Too many requests. Please try again after a minute.');
  }
}
