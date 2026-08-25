import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GroupMemberRole } from '@prisma/client';
import { HttpError } from '@/lib/api/middleware/errorHandler';
import { GroupService } from '@/lib/api/services/group.service';
import { GroupRepository } from '@/lib/api/repositories/group.repository';
import { UserRepository } from '@/lib/api/repositories/user.repository';

vi.mock('@/lib/api/repositories/group.repository', () => ({
  GroupRepository: {
    createWithAdminMember: vi.fn(),
    findGroupsForUser: vi.fn(),
    findById: vi.fn(),
    findByIdWithMembers: vi.fn(),
    findMembership: vi.fn(),
    findMemberById: vi.fn(),
    countMembers: vi.fn(),
    countAdmins: vi.fn(),
    addMember: vi.fn(),
    updateMemberRole: vi.fn(),
    removeMember: vi.fn(),
    createInvite: vi.fn(),
    findPendingInvite: vi.fn(),
    markInviteAccepted: vi.fn(),
  },
}));

vi.mock('@/lib/api/repositories/user.repository', () => ({
  UserRepository: {
    findByUsername: vi.fn(),
    findByEmail: vi.fn(),
    findByMobile: vi.fn(),
  },
}));

const mockedCreateWithAdmin = vi.mocked(GroupRepository.createWithAdminMember);
const mockedFindMembership = vi.mocked(GroupRepository.findMembership);
const mockedFindById = vi.mocked(GroupRepository.findById);
const mockedCountMembers = vi.mocked(GroupRepository.countMembers);
const mockedAddMember = vi.mocked(GroupRepository.addMember);
const mockedFindByEmail = vi.mocked(UserRepository.findByEmail);
const mockedFindMemberById = vi.mocked(GroupRepository.findMemberById);
const mockedUpdateMemberRole = vi.mocked(GroupRepository.updateMemberRole);
const mockedFindByIdWithMembers = vi.mocked(GroupRepository.findByIdWithMembers);
const mockedCreateInvite = vi.mocked(GroupRepository.createInvite);
const mockedFindPendingInvite = vi.mocked(GroupRepository.findPendingInvite);

describe('GroupService membership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a group with the creator as ADMIN', async () => {
    mockedCreateWithAdmin.mockResolvedValue({
      group: {
        id: 'group-1',
        name: 'Flatmates',
        description: null,
        createdAt: new Date('2026-08-24T10:00:00.000Z'),
      },
      member: {
        id: 'member-1',
        role: GroupMemberRole.ADMIN,
      },
    } as never);

    const result = await GroupService.createGroup('user-1', { name: 'Flatmates' });

    expect(result.myRole).toBe('ADMIN');
    expect(result.memberCount).toBe(1);
    expect(mockedCreateWithAdmin).toHaveBeenCalledWith({
      name: 'Flatmates',
      description: null,
      createdById: 'user-1',
    });
  });

  it('joins an existing user immediately when inviting by email', async () => {
    mockedFindMembership
      .mockResolvedValueOnce({ id: 'admin-member', role: GroupMemberRole.ADMIN, userId: 'user-1' } as never)
      .mockResolvedValueOnce(null);
    mockedFindById.mockResolvedValue({ id: 'group-1', name: 'Flatmates' } as never);
    mockedCountMembers.mockResolvedValue(2);
    mockedFindByEmail.mockResolvedValue({
      id: 'user-2',
      email: 'jane@example.com',
      status: 'A',
    } as never);
    mockedAddMember.mockResolvedValue({ id: 'member-2', role: GroupMemberRole.MEMBER } as never);
    mockedFindPendingInvite.mockResolvedValue(null);

    const result = await GroupService.inviteMember('group-1', 'user-1', { email: 'jane@example.com' });

    expect(result.status).toBe('joined');
    expect(result.memberId).toBe('member-2');
    expect(mockedAddMember).toHaveBeenCalledWith('group-1', 'user-2', GroupMemberRole.MEMBER);
  });

  it('creates a pending invite when the user does not exist', async () => {
    mockedFindMembership.mockResolvedValue({ id: 'admin-member', role: GroupMemberRole.ADMIN } as never);
    mockedFindById.mockResolvedValue({ id: 'group-1', name: 'Flatmates' } as never);
    mockedCountMembers.mockResolvedValue(1);
    mockedFindByEmail.mockResolvedValue(null);
    mockedFindPendingInvite.mockResolvedValue(null);

    const result = await GroupService.inviteMember('group-1', 'user-1', { email: 'missing@example.com' });

    expect(result.status).toBe('invited');
    expect(mockedCreateInvite).toHaveBeenCalled();
  });

  it('promotes a member to ADMIN', async () => {
    mockedFindMembership.mockResolvedValue({ id: 'admin-member', role: GroupMemberRole.ADMIN } as never);
    mockedFindMemberById.mockResolvedValue({
      id: 'member-2',
      groupId: 'group-1',
      role: GroupMemberRole.MEMBER,
    } as never);
    mockedUpdateMemberRole.mockResolvedValue({
      id: 'member-2',
      role: GroupMemberRole.ADMIN,
    } as never);

    const result = await GroupService.promoteMember('group-1', 'user-1', 'member-2');

    expect(result.role).toBe('ADMIN');
  });

  it('denies group detail access to non-members', async () => {
    mockedFindMembership.mockResolvedValue(null);

    await expect(GroupService.getGroupDetail('group-1', 'outsider-1')).rejects.toMatchObject({
      status: 403,
    });
  });

  it('returns group detail for members', async () => {
    mockedFindMembership.mockResolvedValue({ id: 'member-1', role: GroupMemberRole.ADMIN, userId: 'user-1' } as never);
    mockedFindByIdWithMembers.mockResolvedValue({
      id: 'group-1',
      name: 'Flatmates',
      description: 'Shared flat',
      createdAt: new Date('2026-08-24T10:00:00.000Z'),
      updatedAt: new Date('2026-08-24T10:00:00.000Z'),
      members: [
        {
          id: 'member-1',
          userId: 'user-1',
          role: GroupMemberRole.ADMIN,
          joinedAt: new Date('2026-08-24T10:00:00.000Z'),
          user: {
            id: 'user-1',
            username: 'alex_sterling',
            firstName: 'Alex',
            lastName: 'Sterling',
            email: 'alex@example.com',
            mobile: null,
          },
        },
      ],
    } as never);

    const detail = await GroupService.getGroupDetail('group-1', 'user-1');

    expect(detail.myRole).toBe('ADMIN');
    expect(detail.members).toHaveLength(1);
  });

  it('throws HttpError for forbidden access', async () => {
    mockedFindMembership.mockResolvedValue(null);
    await expect(GroupService.assertMember('group-1', 'user-2')).rejects.toBeInstanceOf(HttpError);
  });
});
