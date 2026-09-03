import { prisma } from '@/lib/prisma';

export class HealthRepository {
  static async ping(): Promise<void> {
    await prisma.$queryRaw`SELECT 1`;
  }
}
