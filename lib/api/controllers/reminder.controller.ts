import { NextRequest } from 'next/server';
import { BaseController } from './base.controller';
import { ReminderService } from '../services/reminder.service';
import {
  createReminderSchema,
  updateReminderSchema,
  reminderListQuerySchema,
} from '../dtos/reminder.dto';

export class ReminderController extends BaseController {
  static async listPersonal(req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => {
      const { searchParams } = new URL(req.url);
      const query = reminderListQuerySchema.parse({
        from: searchParams.get('from') ?? undefined,
        to: searchParams.get('to') ?? undefined,
        page: searchParams.get('page') ?? undefined,
        pageSize: searchParams.get('pageSize') ?? undefined,
      });
      return ReminderService.listPersonal(userId, query);
    }, { fallbackMessage: 'Failed to fetch reminders' });
  }

  static async createPersonal(req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = createReminderSchema.parse(body);
      return ReminderService.createPersonal(userId, validated);
    }, { status: 201, fallbackMessage: 'Failed to create reminder' });
  }

  static async updatePersonal(req: NextRequest, id: string, userId: string) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = updateReminderSchema.parse(body);
      return ReminderService.updatePersonal(id, userId, validated);
    }, { fallbackMessage: 'Failed to update reminder' });
  }

  static async deletePersonal(_req: NextRequest, id: string, userId: string) {
    return this.safeExecuteJson(async () => ReminderService.deletePersonal(id, userId), {
      fallbackMessage: 'Failed to delete reminder',
    });
  }

  static async listGroup(req: NextRequest, groupId: string, userId: string) {
    return this.safeExecuteJson(async () => {
      const { searchParams } = new URL(req.url);
      const query = reminderListQuerySchema.parse({
        from: searchParams.get('from') ?? undefined,
        to: searchParams.get('to') ?? undefined,
        page: searchParams.get('page') ?? undefined,
        pageSize: searchParams.get('pageSize') ?? undefined,
      });
      return ReminderService.listGroup(groupId, userId, query);
    }, { fallbackMessage: 'Failed to fetch group reminders' });
  }

  static async createGroup(req: NextRequest, groupId: string, userId: string) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = createReminderSchema.parse(body);
      return ReminderService.createGroup(groupId, userId, validated);
    }, { status: 201, fallbackMessage: 'Failed to create group reminder' });
  }

  static async updateGroup(req: NextRequest, groupId: string, id: string, userId: string) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = updateReminderSchema.parse(body);
      return ReminderService.updateGroup(groupId, id, userId, validated);
    }, { fallbackMessage: 'Failed to update group reminder' });
  }

  static async deleteGroup(_req: NextRequest, groupId: string, id: string, userId: string) {
    return this.safeExecuteJson(async () => ReminderService.deleteGroup(groupId, id, userId), {
      fallbackMessage: 'Failed to delete group reminder',
    });
  }

  static async upcoming(_req: NextRequest, userId: string) {
    return this.safeExecuteJson(async () => ({
      items: await ReminderService.listUpcomingPersonal(userId),
    }), { fallbackMessage: 'Failed to fetch upcoming reminders' });
  }
}
