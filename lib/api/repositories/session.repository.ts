import { prisma } from '@/lib/prisma';
import { Session } from '@prisma/client';

export class SessionRepository {
  static async findActiveByJwt(jwt: string): Promise<Session | null> {
    return prisma.session.findFirst({
      where: {
        jwt,
        status: 'A',
        logoutTime: null,
        expiryTime: { gte: new Date() },
      },
    });
  }

  static async findByAdmin(adminId: string, take = 5): Promise<Session[]> {
    return prisma.session.findMany({
      where: { adminId },
      orderBy: { loginTime: 'desc' },
      take,
    });
  }

  static async countActiveByAdmin(adminId: string): Promise<number> {
    return prisma.session.count({
      where: { adminId, status: 'A', logoutTime: null, expiryTime: { gte: new Date() } },
    });
  }

  static async create(data: {
    jwt: string;
    userId?: string;
    adminId?: string;
    expiryTime: Date;
  }): Promise<Session> {
    return prisma.session.create({
      data: {
        ...data,
        status: 'A',
      },
    });
  }

  static async countByUserId(userId: string): Promise<number> {
    return prisma.session.count({ where: { userId } });
  }

  static async invalidate(jwt: string) {
    return prisma.session.updateMany({
      where: { jwt, status: 'A' },
      data: {
        logoutTime: new Date(),
        status: 'I',
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
