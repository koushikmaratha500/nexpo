import { Status } from '@prisma/client';

export interface PasswordResetToken {
  id: string;
  token: string;
  email: string;
  adminId: string | null;
  userId: string | null;
  expiresAt: Date;
  usedAt: Date | null;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}
