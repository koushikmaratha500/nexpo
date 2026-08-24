import { Redis } from '@upstash/redis';
import { kv } from '@vercel/kv';

type KvClient = Redis | typeof kv;

interface MemoryEntry {
  value: string;
  expiresAt: number;
}

const memoryStore = new Map<string, MemoryEntry>();

const isUpstashConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const isKvConfigured = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

let redisClient: Redis | null = null;
let kvReady = false;

if (isUpstashConfigured) {
  try {
    redisClient = Redis.fromEnv();
  } catch (error) {
    console.warn('Failed to initialize Upstash Redis:', error);
  }
}

if (!redisClient && isKvConfigured) {
  kvReady = true;
}

export function isRedisConfigured(): boolean {
  return redisClient !== null || kvReady;
}

export function isProductionEnv(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function getKvClient(): KvClient | null {
  if (redisClient) return redisClient;
  if (kvReady) return kv;
  return null;
}

function purgeExpiredMemoryEntries(now = Date.now()): void {
  for (const [key, entry] of memoryStore.entries()) {
    if (entry.expiresAt <= now) {
      memoryStore.delete(key);
    }
  }
}

export async function kvGetJson<T>(key: string): Promise<T | null> {
  const client = getKvClient();
  if (client) {
    const raw = await client.get<string>(key);
    if (!raw) return null;
    return typeof raw === 'string' ? (JSON.parse(raw) as T) : (raw as T);
  }

  purgeExpiredMemoryEntries();
  const entry = memoryStore.get(key);
  if (!entry || entry.expiresAt <= Date.now()) {
    memoryStore.delete(key);
    return null;
  }

  return JSON.parse(entry.value) as T;
}

export async function kvSetJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const client = getKvClient();
  const serialized = JSON.stringify(value);

  if (client) {
    await client.set(key, serialized, { ex: ttlSeconds });
    return;
  }

  if (isProductionEnv()) {
    throw new Error('Redis is required for persistent storage in production');
  }

  memoryStore.set(key, {
    value: serialized,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export async function kvDelete(key: string): Promise<void> {
  const client = getKvClient();
  if (client) {
    await client.del(key);
    return;
  }

  memoryStore.delete(key);
}

export function clearMemoryKvStore(): void {
  memoryStore.clear();
}
