import { Status } from '@prisma/client';

export interface SupportTicket {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  adminNotes: string | null;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSupportTicketParams {
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  adminNotes?: string | null;
  status?: Status;
}
