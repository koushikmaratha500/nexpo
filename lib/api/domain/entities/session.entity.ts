import { Status } from '@prisma/client';

export interface Session {
  id: string;
  jwt: string;
  userId: string | null;
  adminId: string | null;
  user?: import('./user.entity').User;
  admin?: import('./admin.entity').Admin;
  loginTime: Date;
  expiryTime: Date;
  logoutTime: Date | null;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSessionParams {
  jwt: string;
  userId?: string | null;
  adminId?: string | null;
  expiryTime: Date;
  status?: Status;
}
