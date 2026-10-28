import { describe, it, expect, beforeEach } from 'vitest';
import {
  userDashboardCacheKey,
  getCachedUserDashboard,
  setCachedUserDashboard,
  invalidateUserDashboardCache,
} from '@/lib/api/services/dashboard-cache.service';
import { clearMemoryKvStore } from '@/lib/api/utils/redisClient';

describe('dashboard-cache.service', () => {
  beforeEach(() => {
    clearMemoryKvStore();
  });

  it('uses isolated per-user cache keys', () => {
    expect(userDashboardCacheKey('user-a')).not.toBe(userDashboardCacheKey('user-b'));
    expect(userDashboardCacheKey('user-a')).toContain('user-a');
  });

  it('stores and retrieves dashboard payloads', async () => {
    const payload = {
      month: '2026-10',
      totalSpend: 10,
      todaySpend: 1,
      totalDeposits: 20,
      chart: { labels: ['1'], income: [0], expenses: [1] },
      categoryBreakdown: [],
      recentTransactions: [],
    };
    await setCachedUserDashboard('user-1', payload);
    const cached = await getCachedUserDashboard('user-1');
    expect(cached?.totalSpend).toBe(10);
  });

  it('invalidate clears cached payload without throwing', async () => {
    await setCachedUserDashboard('user-1', {
      month: '2026-10',
      totalSpend: 0,
      todaySpend: 0,
      totalDeposits: 0,
      chart: { labels: [], income: [], expenses: [] },
      categoryBreakdown: [],
      recentTransactions: [],
    });
    await invalidateUserDashboardCache('user-1');
    const cached = await getCachedUserDashboard('user-1');
    expect(cached).toBeNull();
  });
});
