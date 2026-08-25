import { HttpError } from '../middleware/errorHandler';
import { GroupRepository } from '../repositories/group.repository';
import { GroupTransactionRepository } from '../repositories/group-transaction.repository';

function userSummary(user: {
  id: string;
  username?: string | null;
  firstName: string;
  lastName?: string | null;
  email?: string | null;
}) {
  return {
    id: user.id,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName || '',
    email: user.email,
  };
}

export class AdminGroupService {
  static async listGroups(params: { page?: number; pageSize?: number; search?: string }) {
    const { items, total } = await GroupRepository.findAllAdmin(
      params.page,
      params.pageSize,
      params.search,
    );

    return {
      items: items.map((group) => ({
        id: group.id,
        name: group.name,
        description: group.description,
        memberCount: group._count.members,
        createdAt: group.createdAt.toISOString(),
        createdBy: userSummary(group.createdBy),
      })),
      total,
    };
  }

  static async getGroupDetail(groupId: string) {
    const group = await GroupRepository.findByIdWithMembers(groupId);
    if (!group) {
      throw new HttpError(404, 'Group not found');
    }

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString(),
      createdBy: userSummary(group.createdBy),
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

  static async getGroupBalances(groupId: string) {
    const group = await GroupRepository.findById(groupId);
    if (!group) {
      throw new HttpError(404, 'Group not found');
    }

    const balances = await GroupTransactionRepository.computeBalances(groupId);
    return {
      currencyCode: balances.currencyCode,
      currencySymbol: balances.currencySymbol,
      members: balances.members,
    };
  }
}
