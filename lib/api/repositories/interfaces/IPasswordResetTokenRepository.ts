import { PasswordResetToken } from '../../domain/entities/password-reset-token.entity';

export interface IPasswordResetTokenRepository {
  create(data: {
    token: string;
    email: string;
    adminId?: string | null;
    userId?: string | null;
    expiresAt: Date;
    status?: string;
  }): Promise<PasswordResetToken>;

  findByToken(token: string): Promise<PasswordResetToken | null>;

  invalidateAllForEmail(email: string, adminId?: string, userId?: string): Promise<{ count: number }>;

  markAsUsed(id: string): Promise<PasswordResetToken>;

  markAsExpired(id: string): Promise<PasswordResetToken>;
}
