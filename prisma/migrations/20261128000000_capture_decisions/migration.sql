-- Mobile auto-capture Save/Reject decisions (fingerprints only, no message text).
CREATE TYPE "CaptureDecisionKind" AS ENUM ('SAVED', 'REJECTED');

CREATE TABLE "CaptureDecision" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "reference" TEXT,
    "decision" "CaptureDecisionKind" NOT NULL,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaptureDecision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CaptureDecision_userId_fingerprint_key" ON "CaptureDecision"("userId", "fingerprint");
CREATE INDEX "CaptureDecision_userId_reference_idx" ON "CaptureDecision"("userId", "reference");
CREATE INDEX "CaptureDecision_userId_createdAt_idx" ON "CaptureDecision"("userId", "createdAt");

ALTER TABLE "CaptureDecision" ADD CONSTRAINT "CaptureDecision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
