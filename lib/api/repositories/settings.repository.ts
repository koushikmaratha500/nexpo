import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class SettingsRepository {
  static async findAll() {
    return prisma.systemSetting.findMany();
  }

  static async upsert(key: string, value: Prisma.InputJsonValue, updatedByAdminId?: string) {
    return prisma.systemSetting.upsert({
      where: { key },
      create: {
        key,
        value,
        updatedByAdminId: updatedByAdminId ?? null,
      },
      update: {
        value,
        updatedByAdminId: updatedByAdminId ?? null,
      },
    });
  }

  static async upsertMany(
    entries: Array<{ key: string; value: Prisma.InputJsonValue }>,
    updatedByAdminId?: string,
  ) {
    return Promise.all(entries.map((entry) => this.upsert(entry.key, entry.value, updatedByAdminId)));
  }
}
