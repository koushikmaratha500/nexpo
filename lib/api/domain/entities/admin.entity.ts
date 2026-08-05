import { Status } from '@prisma/client';

export interface Admin {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string | null;
  profileImageUrl: string | null;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAdminParams {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName?: string | null;
  profileImageUrl?: string | null;
  status?: Status;
}

export interface UpdateAdminParams {
  email?: string;
  passwordHash?: string;
  firstName?: string;
  lastName?: string | null;
  profileImageUrl?: string | null;
  status?: Status;
}
