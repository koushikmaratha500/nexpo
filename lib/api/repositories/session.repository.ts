import { prisma } from '@/lib/prisma';

export class SessionRepository {
  static async findActiveByJwt(jwt: string) {
    return prisma.session.findFirst({
      where: {
        jwt,
        status: 'A',
        logoutTime: null,
        expiryTime: { gte: new Date() },
      },
    });
  }

  static async create(data: {
    jwt: string;
    userId?: string;
    adminId?: string;
    expiryTime: Date;
  }) {
    return prisma.session.create({
      data: {
        ...data,
        status: 'A',
      },
    });
  }

  static async invalidate(jwt: string) {
    return prisma.session.updateMany({
      where: { jwt, status: 'A' },
      data: {
        logoutTime: new Date(),
        status: 'I', // Inactive
      },
    });
  }

  static async invalidateAllForUser(userId: string) {
    return prisma.session.updateMany({
      where: { userId, status: 'A' },
      data: {
        logoutTime: new Date(),
        status: 'I',
      },
    });
  }

  static async invalidateAllForAdmin(adminId: string) {
    return prisma.session.updateMany({
      where: { adminId, status: 'A' },
      data: {
        logoutTime: new Date(),
        status: 'I',
      },
    });
  }
}
