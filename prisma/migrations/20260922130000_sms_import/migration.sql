-- CreateEnum
ALTER TYPE "BotChannel" ADD VALUE IF NOT EXISTS 'SMS';

-- CreateEnum
CREATE TYPE "SmsIngestStatus" AS ENUM ('PENDING', 'PARSING', 'PARSED', 'SKIPPED', 'FAILED', 'DUPLICATE');

-- CreateTable
CREATE TABLE "UserSmsImportSettings" (
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

-- CreateTable
CREATE TABLE "SmsIngestMessage" (
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

-- CreateTable
CREATE TABLE "TransactionImportFingerprint" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'sms',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionImportFingerprint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SmsIngestMessage_userId_messageHash_key" ON "SmsIngestMessage"("userId", "messageHash");

-- CreateIndex
CREATE INDEX "SmsIngestMessage_userId_status_idx" ON "SmsIngestMessage"("userId", "status");

-- CreateIndex
CREATE INDEX "SmsIngestMessage_syncBatchId_idx" ON "SmsIngestMessage"("syncBatchId");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionImportFingerprint_userId_fingerprint_key" ON "TransactionImportFingerprint"("userId", "fingerprint");

-- CreateIndex
CREATE INDEX "TransactionImportFingerprint_userId_createdAt_idx" ON "TransactionImportFingerprint"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "UserSmsImportSettings" ADD CONSTRAINT "UserSmsImportSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsIngestMessage" ADD CONSTRAINT "SmsIngestMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionImportFingerprint" ADD CONSTRAINT "TransactionImportFingerprint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
