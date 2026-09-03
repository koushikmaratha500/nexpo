import { NextRequest } from 'next/server';
import { BaseController } from './base.controller';
import { AdminGroupService } from '../services/admin-group.service';
import { adminGroupListQuerySchema } from '../dtos/admin-group.dto';

export class AdminGroupController extends BaseController {
  static async list(req: NextRequest) {
    return this.safeExecuteJson(async () => {
      const { searchParams } = new URL(req.url);
      const query = adminGroupListQuerySchema.parse(Object.fromEntries(searchParams.entries()));
      return AdminGroupService.listGroups(query);
    }, { fallbackMessage: 'Failed to fetch groups' });
  }

  static async getById(_req: NextRequest, groupId: string) {
    return this.safeExecuteJson(async () => AdminGroupService.getGroupDetail(groupId), {
      fallbackMessage: 'Failed to fetch group',
    });
  }

  static async getBalances(_req: NextRequest, groupId: string) {
    return this.safeExecuteJson(async () => AdminGroupService.getGroupBalances(groupId), {
      fallbackMessage: 'Failed to fetch group balances',
    });
  }
}
