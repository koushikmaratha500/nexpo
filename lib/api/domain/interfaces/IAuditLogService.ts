export interface IAuditLogService {
  logUserAction(
    userId: string,
    action: string,
    oldValue?: Record<string, unknown>,
    newValue?: Record<string, unknown>,
    meta?: { ip?: string; ua?: string }
  ): Promise<void>;
  logAdminAction(
    adminId: string,
    action: string,
    oldValue?: Record<string, unknown>,
    newValue?: Record<string, unknown>,
    meta?: { ip?: string; ua?: string }
  ): Promise<void>;
  logTransactionAction(
    transactionId: string,
    action: string,
    oldValue?: Record<string, unknown>,
    newValue?: Record<string, unknown>,
    meta?: { ip?: string; ua?: string }
  ): Promise<void>;
}
