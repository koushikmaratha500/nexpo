import { Session, CreateSessionParams } from '../../domain/entities/session.entity';

export interface SessionQueryParams {
  userId?: string;
  adminId?: string;
  status?: string;
}

export interface ISessionRepository {
  findActiveByJwt(jwt: string): Promise<Session | null>;
  create(data: CreateSessionParams): Promise<Session>;
  invalidate(jwt: string): Promise<{ count: number }>;
  invalidateAllForUser(userId: string): Promise<{ count: number }>;
  invalidateAllForAdmin(adminId: string): Promise<{ count: number }>;
}
