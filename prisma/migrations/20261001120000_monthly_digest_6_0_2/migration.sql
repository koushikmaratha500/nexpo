-- CreateEnum
CREATE TYPE "MonthlyDigestDeliveryStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'SKIPPED');

-- AlterTable
ALTER TABLE "UserNotificationPreference" ADD COLUMN "monthlyDigestEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "MonthlyDigestDelivery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "status" "MonthlyDigestDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "resendEmailId" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyDigestDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MonthlyDigestDelivery_period_status_idx" ON "MonthlyDigestDelivery"("period", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyDigestDelivery_userId_period_key" ON "MonthlyDigestDelivery"("userId", "period");

-- AddForeignKey
ALTER TABLE "MonthlyDigestDelivery" ADD CONSTRAINT "MonthlyDigestDelivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
