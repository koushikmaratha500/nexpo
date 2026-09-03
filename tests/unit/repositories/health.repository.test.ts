import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HealthRepository } from '@/lib/api/repositories/health.repository';

const queryRaw = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => queryRaw(...args),
  },
}));

describe('HealthRepository', () => {
  beforeEach(() => {
    queryRaw.mockReset();
    queryRaw.mockResolvedValue([{ '?column?': 1 }]);
  });

  it('pings the database with SELECT 1', async () => {
    await expect(HealthRepository.ping()).resolves.toBeUndefined();
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });

  it('surfaces database errors', async () => {
    queryRaw.mockRejectedValue(new Error('db down'));
    await expect(HealthRepository.ping()).rejects.toThrow('db down');
  });
});
