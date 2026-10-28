import { kvDelete, kvGetJson, kvSetJson } from '../utils/redisClient';
import { secondsUntilNextMidnightInTz } from '../utils/app-timezone';
import type { CustomerDashboardPayload } from '../domain/customer-dashboard';

const CACHE_NAMESPACE = 'nexpo:dashboard:v1:user';

export function userDashboardCacheKey(userId: string): string {
  return `${CACHE_NAMESPACE}:${userId}`;
}

export async function getCachedUserDashboard(
  userId: string,
): Promise<CustomerDashboardPayload | null> {
  return kvGetJson<CustomerDashboardPayload>(userDashboardCacheKey(userId));
}

export async function setCachedUserDashboard(
  userId: string,
  payload: CustomerDashboardPayload,
): Promise<void> {
  const ttlSeconds = secondsUntilNextMidnightInTz();
  await kvSetJson(userDashboardCacheKey(userId), payload, ttlSeconds);
}

/** Best-effort invalidation; failures are logged and do not affect DB commits. */
export async function invalidateUserDashboardCache(userId: string): Promise<void> {
  try {
    await kvDelete(userDashboardCacheKey(userId));
  } catch (error) {
    console.warn('[dashboard-cache] Failed to invalidate cache for user', userId, error);
  }
}
