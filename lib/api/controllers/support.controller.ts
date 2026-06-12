import { NextRequest, NextResponse } from 'next/server';
import { SupportService } from '../services/support.service';
import { createSupportTicketSchema, updateSupportTicketSchema } from '../dtos/support.dto';

export class SupportController {
  static async create(req: NextRequest) {
    try {
      const body = await req.json();
      const validated = createSupportTicketSchema.parse(body);

      const ip = req.headers.get('x-forwarded-for') || '';
      const ua = req.headers.get('user-agent') || '';

      const ticket = await SupportService.createTicket(validated, { ip, ua });
      return NextResponse.json(ticket, { status: 201 });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const message = error.errors?.[0]?.message || error.issues?.[0]?.message || error.message || 'Validation error';
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: error.message || 'Failed to create support ticket' }, { status: 400 });
    }
  }

  static async getById(req: NextRequest, id: string) {
    try {
      const ticket = await SupportService.getTicketById(id);
      return NextResponse.json(ticket);
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Support ticket not found' }, { status: 404 });
    }
  }

  static async getAll(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = parseInt(searchParams.get('pageSize') || '100', 10);

      const result = await SupportService.getTickets(page, pageSize);
      return NextResponse.json(result);
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Failed to fetch support tickets' }, { status: 500 });
    }
  }

  static async update(req: NextRequest, id: string, adminId: string) {
    try {
      const body = await req.json();
      const validated = updateSupportTicketSchema.parse(body);

      const ip = req.headers.get('x-forwarded-for') || '';
      const ua = req.headers.get('user-agent') || '';

      const updated = await SupportService.updateTicket(id, adminId, validated, { ip, ua });
      return NextResponse.json(updated);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const message = error.errors?.[0]?.message || error.issues?.[0]?.message || error.message || 'Validation error';
        return NextResponse.json({ error: message }, { status: 400 });
      }
      return NextResponse.json({ error: error.message || 'Failed to update support ticket' }, { status: 400 });
    }
  }

  static async delete(req: NextRequest, id: string, adminId: string) {
    try {
      const ip = req.headers.get('x-forwarded-for') || '';
      const ua = req.headers.get('user-agent') || '';

      await SupportService.deleteTicket(id, adminId, { ip, ua });
      return NextResponse.json({ success: true, message: 'Support ticket soft-deleted successfully' });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Failed to delete support ticket' }, { status: 400 });
    }
  }
}
