import { NextRequest } from 'next/server';
import { BaseController } from './base.controller';
import { SupportService } from '../services/support.service';
import { createSupportTicketSchema, updateSupportTicketSchema } from '../dtos/support.dto';

export class SupportController extends BaseController {
  static async create(req: NextRequest) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = createSupportTicketSchema.parse(body);
      const meta = this.requestMeta(req);
      return SupportService.createTicket(validated, meta);
    }, { status: 201, fallbackMessage: 'Failed to create support ticket' });
  }

  static async getById(_req: NextRequest, id: string) {
    return this.safeExecuteJson(
      async () => SupportService.getTicketById(id),
      { errorStatus: 404, fallbackMessage: 'Support ticket not found' },
    );
  }

  static async getAll(req: NextRequest) {
    return this.safeExecuteJson(async () => {
      const { searchParams } = new URL(req.url);
      return SupportService.getTickets(
        parseInt(searchParams.get('page') || '1', 10),
        parseInt(searchParams.get('pageSize') || '100', 10),
      );
    }, { fallbackMessage: 'Failed to fetch support tickets' });
  }

  static async update(req: NextRequest, id: string, adminId: string) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = updateSupportTicketSchema.parse(body);
      const meta = this.requestMeta(req);
      return SupportService.updateTicket(id, adminId, validated, meta);
    }, { fallbackMessage: 'Failed to update support ticket' });
  }

  static async delete(req: NextRequest, id: string, adminId: string) {
    return this.safeExecuteJson(async () => {
      const meta = this.requestMeta(req);
      await SupportService.deleteTicket(id, adminId, meta);
      return { success: true, message: 'Support ticket soft-deleted successfully' };
    }, { fallbackMessage: 'Failed to delete support ticket' });
  }
}
