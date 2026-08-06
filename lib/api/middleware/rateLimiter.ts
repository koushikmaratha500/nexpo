import { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { kv } from '@vercel/kv';
import { HttpError } from './errorHandler';

// Simple in-memory fallback
const memoryStore = new Map<string, { count: number; resetAt: number }>();

const isUpstashConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const isKvConfigured = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

let redis: Redis | null = null;
if (isUpstashConfigured) {
  try {
    redis = Redis.fromEnv();
    console.log('Upstash Redis initialized for Rate Limiting');
  } catch (error) {
    console.warn('Failed to initialize Upstash Redis, checking Vercel KV fallback:', error);
  }
}

let kvReady = false;
if (!redis && isKvConfigured) {
  try {
    kvReady = true;
    console.log('Vercel KV initialized for Rate Limiting');
  } catch (error) {
    console.warn('Failed to initialize Vercel KV, using memory fallback:', error);
  }
}

const ratelimitInstances = new Map<string, Ratelimit>();

function getRatelimit(limit: number, windowSeconds: number): Ratelimit | null {
  if (!redis && !kvReady) return null;
  const key = `${limit}_${windowSeconds}`;
  let instance = ratelimitInstances.get(key);
  if (!instance) {
    instance = new Ratelimit({
      redis: redis ?? kv,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      analytics: true,
      prefix: `nexpo_ratelimit_${limit}_${windowSeconds}`,
    });
    ratelimitInstances.set(key, instance);
  }
  return instance;
}

export interface RateLimitOptions {
  limit?: number;
  windowSeconds?: number;
}

export async function checkRateLimit(
  req: NextRequest,
  identifier: string,
  options: RateLimitOptions = {}
): Promise<void> {
  const limit = options.limit ?? 50;
  const windowSeconds = options.windowSeconds ?? 60;
  const instance = getRatelimit(limit, windowSeconds);

  let success = true;

  if (instance) {
    try {
      const result = await instance.limit(identifier);
      success = result.success;
    } catch (error) {
      console.error('Rate limit redis error, falling back to memory store:', error);
    }
  }

  if (!instance || !success) {
    // Fallback to in-memory rate limiting
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    const record = memoryStore.get(identifier);
    if (!record || now > record.resetAt) {
      const newRecord = { count: 1, resetAt: now + windowMs };
      memoryStore.set(identifier, newRecord);
    } else {
      if (record.count >= limit) {
        success = false;
      } else {
        record.count += 1;
      }
    }
  }

  if (!success) {
    throw new HttpError(429, 'Too many requests. Please try again later.');
  }
}
