-- Release 6.0.1 — Account reset & delete with 7-day retention

CREATE TYPE "AccountLifecycleMode" AS ENUM ('ACTIVE', 'RESET_PENDING', 'DELETE_PENDING');

ALTER TABLE "User"
  ADD COLUMN "accountLifecycleMode" "AccountLifecycleMode" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "accountLifecycleAt" TIMESTAMP(3),
  ADD COLUMN "accountLifecyclePurgeAt" TIMESTAMP(3),
  ADD COLUMN "accountLifecycleBatchId" TEXT;

ALTER TABLE "Transaction" ADD COLUMN "lifecycleBatchId" TEXT;

CREATE INDEX "Transaction_userId_lifecycleBatchId_idx" ON "Transaction"("userId", "lifecycleBatchId");

CREATE INDEX "User_accountLifecyclePurgeAt_accountLifecycleMode_idx"
  ON "User"("accountLifecyclePurgeAt", "accountLifecycleMode");
