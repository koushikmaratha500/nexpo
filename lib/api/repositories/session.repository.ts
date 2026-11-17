import { prisma } from '@/lib/prisma';
import { Session } from '@prisma/client';
import { createHash } from 'crypto';

/** Sessions store sha256(jwt) so a DB leak does not hand out live tokens. */
function hashJwt(jwt: string): string {
  return createHash('sha256').update(jwt, 'utf8').digest('hex');
}

// shortcut: also matches raw-JWT rows written by the previous deploy; drop `raw` once those (30d max) expire.
function jwtMatch(jwt: string) {
  return { in: [hashJwt(jwt), jwt] };
}

export class SessionRepository {
  static async findActiveByJwt(jwt: string): Promise<Session | null> {
    return prisma.session.findFirst({
      where: {
        jwt: jwtMatch(jwt),
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
        jwt: hashJwt(data.jwt),
        status: 'A',
      },
    });
  }

  static async countByUserId(userId: string): Promise<number> {
    return prisma.session.count({ where: { userId } });
  }

  static async invalidate(jwt: string) {
    return prisma.session.updateMany({
      where: { jwt: jwtMatch(jwt), status: 'A' },
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
