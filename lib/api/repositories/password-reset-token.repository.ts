import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class PasswordResetTokenRepository {
  static async invalidateActiveForAdmin(email: string, adminId: string) {
    return prisma.passwordResetToken.updateMany({
      where: { email, status: 'A', adminId },
      data: { status: 'I' },
    });
  }

  static async create(data: Prisma.PasswordResetTokenUncheckedCreateInput) {
    return prisma.passwordResetToken.create({ data });
  }

  static async findByToken(token: string) {
    return prisma.passwordResetToken.findUnique({ where: { token } });
  }

  static async markInactive(id: string) {
    return prisma.passwordResetToken.update({
      where: { id },
      data: { status: 'I' },
    });
  }

  static async markUsed(id: string) {
    return prisma.passwordResetToken.update({
      where: { id },
      data: { status: 'I', usedAt: new Date() },
    });
  }
}
