import { SupportRepository } from '../repositories/support.repository';
import { prisma } from '@/lib/prisma';
import { AuditAction } from '@prisma/client';

export class SupportService {
  static async createTicket(data: any, meta = { ip: '', ua: '' }) {
    const ticket = await SupportRepository.create({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      message: data.message,
      fileUrl: data.fileUrl || null,
      fileName: data.fileName || null,
      fileSize: data.fileSize || null,
    });

    // Audit log
    await prisma.supportTicketAudit.create({
      data: {
        supportTicketId: ticket.id,
        action: AuditAction.CREATE,
        newValue: JSON.parse(JSON.stringify(ticket)),
        ipAddress: meta.ip || null,
        userAgent: meta.ua || null,
      },
    });

    return ticket;
  }

  static async getTickets(page = 1, pageSize = 5) {
    return SupportRepository.findAll(page, pageSize);
  }

  static async getTicketById(id: string) {
    const ticket = await SupportRepository.findById(id);
    if (!ticket) {
      throw new Error('Support ticket not found');
    }
    return ticket;
  }

  static async updateTicket(id: string, adminId: string, data: any, meta = { ip: '', ua: '' }) {
    const original = await SupportRepository.findById(id);
    if (!original) {
      throw new Error('Support ticket not found');
    }

    const updated = await SupportRepository.update(id, data);

    // Audit log
    await prisma.supportTicketAudit.create({
      data: {
        supportTicketId: id,
        adminId,
        action: AuditAction.UPDATE,
        oldValue: JSON.parse(JSON.stringify(original)),
        newValue: JSON.parse(JSON.stringify(updated)),
        ipAddress: meta.ip || null,
        userAgent: meta.ua || null,
      },
    });

    return updated;
  }

  static async deleteTicket(id: string, adminId: string, meta = { ip: '', ua: '' }) {
    const original = await SupportRepository.findById(id);
    if (!original) {
      throw new Error('Support ticket not found');
    }

    await SupportRepository.softDelete(id);

    // Audit log
    await prisma.supportTicketAudit.create({
      data: {
        supportTicketId: id,
        adminId,
        action: AuditAction.DELETE,
        oldValue: JSON.parse(JSON.stringify(original)),
        ipAddress: meta.ip || null,
        userAgent: meta.ua || null,
      },
    });

    return { success: true };
  }
}
