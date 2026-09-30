-- Consolidated schema catch-up for Release 6.x (run once in Supabase SQL Editor OR use `npm run db:push`)
-- Order: 6.1 SMS import, then 6.0.1 account lifecycle

-- === 20260922130000_sms_import ===
ALTER TYPE "BotChannel" ADD VALUE IF NOT EXISTS 'SMS';

CREATE TYPE "SmsIngestStatus" AS ENUM ('PENDING', 'PARSING', 'PARSED', 'SKIPPED', 'FAILED', 'DUPLICATE');

CREATE TABLE IF NOT EXISTS "UserSmsImportSettings" (
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnSync" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncDeviceId" TEXT,
    "lastBatchId" TEXT,
    "lastBatchSummary" JSONB,
    "androidSmsGranted" BOOLEAN NOT NULL DEFAULT false,
    "notificationsGranted" BOOLEAN NOT NULL DEFAULT false,
    "callGranted" BOOLEAN NOT NULL DEFAULT false,
    "locationGranted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserSmsImportSettings_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE IF NOT EXISTS "SmsIngestMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "externalSmsId" TEXT,
    "messageHash" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "status" "SmsIngestStatus" NOT NULL DEFAULT 'PENDING',
    "skipReason" TEXT,
    "botRequestId" TEXT,
    "transactionId" TEXT,
    "syncBatchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SmsIngestMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TransactionImportFingerprint" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'sms',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TransactionImportFingerprint_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SmsIngestMessage_userId_messageHash_key" ON "SmsIngestMessage"("userId", "messageHash");
CREATE INDEX IF NOT EXISTS "SmsIngestMessage_userId_status_idx" ON "SmsIngestMessage"("userId", "status");
CREATE INDEX IF NOT EXISTS "SmsIngestMessage_syncBatchId_idx" ON "SmsIngestMessage"("syncBatchId");
CREATE UNIQUE INDEX IF NOT EXISTS "TransactionImportFingerprint_userId_fingerprint_key" ON "TransactionImportFingerprint"("userId", "fingerprint");
CREATE INDEX IF NOT EXISTS "TransactionImportFingerprint_userId_createdAt_idx" ON "TransactionImportFingerprint"("userId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "UserSmsImportSettings" ADD CONSTRAINT "UserSmsImportSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "SmsIngestMessage" ADD CONSTRAINT "SmsIngestMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "TransactionImportFingerprint" ADD CONSTRAINT "TransactionImportFingerprint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- === 20260927120000_account_lifecycle_6_0_1 ===
DO $$ BEGIN
  CREATE TYPE "AccountLifecycleMode" AS ENUM ('ACTIVE', 'RESET_PENDING', 'DELETE_PENDING');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accountLifecycleMode" "AccountLifecycleMode" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accountLifecycleAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accountLifecyclePurgeAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accountLifecycleBatchId" TEXT;

ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "lifecycleBatchId" TEXT;

CREATE INDEX IF NOT EXISTS "Transaction_userId_lifecycleBatchId_idx" ON "Transaction"("userId", "lifecycleBatchId");
CREATE INDEX IF NOT EXISTS "User_accountLifecyclePurgeAt_accountLifecycleMode_idx" ON "User"("accountLifecyclePurgeAt", "accountLifecycleMode");
