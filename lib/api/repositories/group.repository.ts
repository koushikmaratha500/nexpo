import { prisma } from '@/lib/prisma';
import { GroupInviteStatus, GroupMemberRole, Prisma } from '@prisma/client';

export class GroupRepository {
  static async createWithAdminMember(data: {
    name: string;
    description?: string | null;
    createdById: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          name: data.name,
          description: data.description ?? null,
          createdById: data.createdById,
          status: 'A',
        },
      });

      const member = await tx.groupMember.create({
        data: {
          groupId: group.id,
          userId: data.createdById,
          role: GroupMemberRole.ADMIN,
        },
      });

      return { group, member };
    });
  }

  static async findGroupsForUser(userId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const where = {
      userId,
      group: { status: 'A' as const },
    };

    const [memberships, total] = await Promise.all([
      prisma.groupMember.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { joinedAt: 'desc' },
        include: {
          group: {
            include: {
              _count: { select: { members: true } },
            },
          },
        },
      }),
      prisma.groupMember.count({ where }),
    ]);

    return { memberships, total };
  }

  static async findById(groupId: string) {
    return prisma.group.findFirst({
      where: { id: groupId, status: 'A' },
    });
  }

  static async findByIdWithMembers(groupId: string) {
    return prisma.group.findFirst({
      where: { id: groupId, status: 'A' },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                email: true,
                mobile: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });
  }

  static async findAllAdmin(page = 1, pageSize = 20, search?: string) {
    const skip = (page - 1) * pageSize;
    const where: Prisma.GroupWhereInput = {
      status: 'A',
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.group.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: { select: { members: true } },
        },
      }),
      prisma.group.count({ where }),
    ]);

    return { items, total };
  }

  static async findMembership(groupId: string, userId: string) {
    return prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
  }

  static async findMemberById(memberId: string) {
    return prisma.groupMember.findUnique({
      where: { id: memberId },
      include: { user: true, group: true },
    });
  }

  static async countMembers(groupId: string) {
    return prisma.groupMember.count({ where: { groupId } });
  }

  static async countAdmins(groupId: string) {
    return prisma.groupMember.count({
      where: { groupId, role: GroupMemberRole.ADMIN },
    });
  }

  static async addMember(groupId: string, userId: string, role: GroupMemberRole = GroupMemberRole.MEMBER) {
    return prisma.groupMember.create({
      data: { groupId, userId, role },
    });
  }

  static async updateMemberRole(memberId: string, role: GroupMemberRole) {
    return prisma.groupMember.update({
      where: { id: memberId },
      data: { role },
    });
  }

  static async removeMember(memberId: string) {
    return prisma.groupMember.delete({ where: { id: memberId } });
  }

  static async updateGroup(groupId: string, data: Prisma.GroupUncheckedUpdateInput) {
    return prisma.group.update({
      where: { id: groupId },
      data,
    });
  }

  static async softDeleteGroup(groupId: string) {
    return prisma.group.update({
      where: { id: groupId },
      data: { status: 'D' },
    });
  }

  static async createInvite(data: Prisma.GroupInviteUncheckedCreateInput) {
    return prisma.groupInvite.create({ data });
  }

  static async findPendingInvite(groupId: string, identifier: {
    username?: string | null;
    email?: string | null;
    phone?: string | null;
    inviteeUserId?: string | null;
  }) {
    return prisma.groupInvite.findFirst({
      where: {
        groupId,
        status: GroupInviteStatus.PENDING,
        OR: [
          identifier.username ? { username: identifier.username } : undefined,
          identifier.email ? { email: identifier.email } : undefined,
          identifier.phone ? { phone: identifier.phone } : undefined,
          identifier.inviteeUserId ? { inviteeUserId: identifier.inviteeUserId } : undefined,
        ].filter(Boolean) as Prisma.GroupInviteWhereInput[],
      },
    });
  }

  static async markInviteAccepted(inviteId: string) {
    return prisma.groupInvite.update({
      where: { id: inviteId },
      data: { status: GroupInviteStatus.ACCEPTED },
    });
  }
}
