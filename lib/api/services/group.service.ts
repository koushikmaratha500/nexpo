import { GroupMemberRole } from '@prisma/client';
import { HttpError } from '../middleware/errorHandler';
import { GroupRepository } from '../repositories/group.repository';
import { UserRepository } from '../repositories/user.repository';
import { normalizeUsername } from '../utils/username';
import type { CreateGroupDto, InviteGroupMemberDto, UpdateGroupDto } from '../dtos/group.dto';

const MAX_GROUP_MEMBERS = 50;
const INVITE_TTL_DAYS = 7;

export class GroupService {
  static async resolveUserByIdentifier(params: {
    username?: string;
    email?: string;
    phone?: string;
  }) {
    if (params.username) {
      return UserRepository.findByUsername(params.username);
    }
    if (params.email) {
      return UserRepository.findByEmail(params.email.trim().toLowerCase());
    }
    if (params.phone) {
      return UserRepository.findByMobile(params.phone.trim());
    }
    return null;
  }

  static async listGroups(userId: string, page = 1, pageSize = 20) {
    const { memberships, total } = await GroupRepository.findGroupsForUser(userId, page, pageSize);
    return {
      items: memberships.map((membership) => ({
        id: membership.group.id,
        name: membership.group.name,
        description: membership.group.description,
        memberCount: membership.group._count.members,
        myRole: membership.role,
        createdAt: membership.group.createdAt.toISOString(),
      })),
      total,
    };
  }

  static async createGroup(userId: string, data: CreateGroupDto) {
    const { group, member } = await GroupRepository.createWithAdminMember({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      createdById: userId,
    });

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      myRole: member.role,
      memberCount: 1,
      createdAt: group.createdAt.toISOString(),
    };
  }

  static async getGroupDetail(groupId: string, userId: string) {
    await this.assertMember(groupId, userId);

    const group = await GroupRepository.findByIdWithMembers(groupId);
    if (!group) {
      throw new HttpError(404, 'Group not found');
    }

    const myMembership = group.members.find((member) => member.userId === userId);

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      myRole: myMembership?.role ?? GroupMemberRole.MEMBER,
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString(),
      members: group.members.map((member) => ({
        memberId: member.id,
        userId: member.user.id,
        username: member.user.username,
        firstName: member.user.firstName,
        lastName: member.user.lastName || '',
        email: member.user.email,
        phone: member.user.mobile,
        role: member.role,
        joinedAt: member.joinedAt.toISOString(),
      })),
    };
  }

  static async updateGroup(groupId: string, userId: string, data: UpdateGroupDto) {
    await this.assertAdmin(groupId, userId);

    const group = await GroupRepository.findById(groupId);
    if (!group) {
      throw new HttpError(404, 'Group not found');
    }

    const updated = await GroupRepository.updateGroup(groupId, {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
    });

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  static async deleteGroup(groupId: string, userId: string) {
    await this.assertAdmin(groupId, userId);

    const group = await GroupRepository.findById(groupId);
    if (!group) {
      throw new HttpError(404, 'Group not found');
    }

    await GroupRepository.softDeleteGroup(groupId);
    return { success: true };
  }

  static async inviteMember(groupId: string, userId: string, data: InviteGroupMemberDto) {
    await this.assertAdmin(groupId, userId);

    const group = await GroupRepository.findById(groupId);
    if (!group) {
      throw new HttpError(404, 'Group not found');
    }

    const memberCount = await GroupRepository.countMembers(groupId);
    if (memberCount >= MAX_GROUP_MEMBERS) {
      throw new HttpError(400, `Groups are limited to ${MAX_GROUP_MEMBERS} members`);
    }

    const invitee = await this.resolveUserByIdentifier(data);
    if (invitee) {
      if (invitee.id === userId) {
        throw new HttpError(400, 'You cannot invite yourself');
      }
      if (invitee.status !== 'A') {
        throw new HttpError(400, 'Only active users can be added to a group');
      }

      const existingMembership = await GroupRepository.findMembership(groupId, invitee.id);
      if (existingMembership) {
        throw new HttpError(400, 'User is already a member of this group');
      }

      const member = await GroupRepository.addMember(groupId, invitee.id, GroupMemberRole.MEMBER);
      const pendingInvite = await GroupRepository.findPendingInvite(groupId, {
        inviteeUserId: invitee.id,
        username: invitee.username,
        email: invitee.email,
        phone: invitee.mobile,
      });
      if (pendingInvite) {
        await GroupRepository.markInviteAccepted(pendingInvite.id);
      }

      return { status: 'joined' as const, memberId: member.id };
    }

    const normalizedUsername = data.username ? normalizeUsername(data.username) : null;
    const normalizedEmail = data.email?.trim().toLowerCase() ?? null;
    const normalizedPhone = data.phone?.trim() ?? null;

    const pendingInvite = await GroupRepository.findPendingInvite(groupId, {
      username: normalizedUsername,
      email: normalizedEmail,
      phone: normalizedPhone,
    });
    if (pendingInvite) {
      return { status: 'invited' as const };
    }

    await GroupRepository.createInvite({
      groupId,
      invitedById: userId,
      username: normalizedUsername,
      email: normalizedEmail,
      phone: normalizedPhone,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
    });

    return { status: 'invited' as const };
  }

  static async promoteMember(groupId: string, actorUserId: string, memberId: string) {
    await this.assertAdmin(groupId, actorUserId);

    const member = await GroupRepository.findMemberById(memberId);
    if (!member || member.groupId !== groupId) {
      throw new HttpError(404, 'Group member not found');
    }

    if (member.role === GroupMemberRole.ADMIN) {
      return { memberId: member.id, role: member.role };
    }

    const updated = await GroupRepository.updateMemberRole(memberId, GroupMemberRole.ADMIN);
    return { memberId: updated.id, role: updated.role };
  }

  static async removeMember(groupId: string, actorUserId: string, memberId: string) {
    const actorMembership = await GroupRepository.findMembership(groupId, actorUserId);
    if (!actorMembership) {
      throw new HttpError(403, 'You do not have access to this group');
    }

    const member = await GroupRepository.findMemberById(memberId);
    if (!member || member.groupId !== groupId) {
      throw new HttpError(404, 'Group member not found');
    }

    const isSelf = member.userId === actorUserId;
    const isAdmin = actorMembership.role === GroupMemberRole.ADMIN;

    if (!isSelf && !isAdmin) {
      throw new HttpError(403, 'Only group admins can remove other members');
    }

    if (member.role === GroupMemberRole.ADMIN) {
      const adminCount = await GroupRepository.countAdmins(groupId);
      const memberCount = await GroupRepository.countMembers(groupId);

      if (adminCount <= 1 && memberCount > 1) {
        throw new HttpError(400, 'Promote another admin before removing the last group admin');
      }

      if (adminCount <= 1 && memberCount === 1) {
        await GroupRepository.softDeleteGroup(groupId);
      }
    }

    await GroupRepository.removeMember(memberId);
    return { success: true };
  }

  static async assertMember(groupId: string, userId: string) {
    const membership = await GroupRepository.findMembership(groupId, userId);
    if (!membership) {
      throw new HttpError(403, 'You do not have access to this group');
    }
    return membership;
  }

  static async assertAdmin(groupId: string, userId: string) {
    const membership = await this.assertMember(groupId, userId);
    if (membership.role !== GroupMemberRole.ADMIN) {
      throw new HttpError(403, 'Only group admins can perform this action');
    }
    return membership;
  }
}
