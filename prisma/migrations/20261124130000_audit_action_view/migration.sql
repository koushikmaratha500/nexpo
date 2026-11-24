-- Admin views of sensitive user data (e.g. AI chats) are recorded in UserAudit.
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'VIEW';
