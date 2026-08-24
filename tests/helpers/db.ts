import { prisma } from '@/lib/prisma';

export function hasTestDatabase(): boolean {
  return Boolean(process.env.TEST_DATABASE_URL || process.env.DATABASE_URL);
}

export function getTestDatabaseUrl(): string {
  return process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || '';
}

export async function disconnectTestDatabase(): Promise<void> {
  await prisma.$disconnect();
}

export function buildTransactionFactory(overrides: Record<string, unknown> = {}) {
  return {
    userId: 'test-user-id',
    type: 'DEBIT' as const,
    title: 'Test transaction',
    amount: 100,
    transactionDate: new Date('2026-01-15'),
    categoryId: 'cat-id',
    currencyId: 'cur-id',
    paymentTypeId: 'pay-id',
    status: 'A' as const,
    ...overrides,
  };
}
