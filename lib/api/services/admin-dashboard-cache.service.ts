import { kvDelete, kvGetJson, kvSetJson } from '../utils/redisClient';
import { secondsUntilNextMidnightInTz } from '../utils/app-timezone';

const GLOBAL_DASHBOARD_KEY = 'nexpo:dashboard:v1:admin:global';

export interface AdminDashboardChartPayload {
  monthlyLedgerFlow: { month: string; value: number }[];
  spendDistribution: { region: string; amount: number; percentage: number }[];
}

export async function getCachedAdminDashboardCharts(): Promise<AdminDashboardChartPayload | null> {
  return kvGetJson<AdminDashboardChartPayload>(GLOBAL_DASHBOARD_KEY);
}

export async function setCachedAdminDashboardCharts(payload: AdminDashboardChartPayload): Promise<void> {
  const ttlSeconds = secondsUntilNextMidnightInTz();
  await kvSetJson(GLOBAL_DASHBOARD_KEY, payload, ttlSeconds);
}

export async function invalidateAdminDashboardCache(): Promise<void> {
  try {
    await kvDelete(GLOBAL_DASHBOARD_KEY);
  } catch (error) {
    console.warn('[admin-dashboard-cache] Failed to invalidate global cache', error);
  }
}
