import { NextRequest } from 'next/server';
import { BaseController } from './base.controller';
import { GroupService } from '../services/group.service';
import {
  createGroupSchema,
  updateGroupSchema,
  inviteGroupMemberSchema,
  groupListQuerySchema,
} from '../dtos/group.dto';

export class GroupController extends BaseController {
  static async list(req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => {
      const { searchParams } = new URL(req.url);
      const query = groupListQuerySchema.parse({
        page: searchParams.get('page') ?? undefined,
        pageSize: searchParams.get('pageSize') ?? undefined,
      });
      return GroupService.listGroups(userId, query.page, query.pageSize);
    }, { fallbackMessage: 'Failed to fetch groups' });
  }

  static async create(req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = createGroupSchema.parse(body);
      return GroupService.createGroup(userId, validated);
    }, { status: 201, fallbackMessage: 'Failed to create group' });
  }

  static async getById(_req: NextRequest, groupId: string, userId: string) {
    return this.safeExecuteJson(async () => GroupService.getGroupDetail(groupId, userId), {
      fallbackMessage: 'Failed to fetch group',
    });
  }

  static async update(req: NextRequest, groupId: string, userId: string) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = updateGroupSchema.parse(body);
      return GroupService.updateGroup(groupId, userId, validated);
    }, { fallbackMessage: 'Failed to update group' });
  }

  static async delete(_req: NextRequest, groupId: string, userId: string) {
    return this.safeExecuteJson(async () => GroupService.deleteGroup(groupId, userId), {
      fallbackMessage: 'Failed to delete group',
    });
  }

  static async inviteMember(req: NextRequest, groupId: string, userId: string) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = inviteGroupMemberSchema.parse(body);
      return GroupService.inviteMember(groupId, userId, validated);
    }, { status: 201, fallbackMessage: 'Failed to invite member' });
  }

  static async promoteMember(_req: NextRequest, groupId: string, userId: string, memberId: string) {
    return this.safeExecuteJson(async () => GroupService.promoteMember(groupId, userId, memberId), {
      fallbackMessage: 'Failed to promote member',
    });
  }

  static async removeMember(_req: NextRequest, groupId: string, userId: string, memberId: string) {
    return this.safeExecuteJson(async () => GroupService.removeMember(groupId, userId, memberId), {
      fallbackMessage: 'Failed to remove member',
    });
  }
}
