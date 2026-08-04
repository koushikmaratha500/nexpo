import { IRepository } from './IRepository';
import { SupportTicket, CreateSupportTicketParams } from '../../domain/entities/support-ticket.entity';

export interface ISupportRepository
  extends IRepository<SupportTicket, CreateSupportTicketParams, Partial<CreateSupportTicketParams>> {
  findAll(params?: { page?: number; pageSize?: number; status?: string }): Promise<{ items: SupportTicket[]; total: number }>;
  findById(id: string): Promise<SupportTicket | null>;
}
