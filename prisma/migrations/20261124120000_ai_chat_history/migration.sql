-- CreateTable
CREATE TABLE "AiChatThread" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiChatThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiChatMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "parts" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiChatThread_userId_lastMessageAt_idx" ON "AiChatThread"("userId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "AiChatMessage_threadId_createdAt_idx" ON "AiChatMessage"("threadId", "createdAt");

-- AddForeignKey
ALTER TABLE "AiChatThread" ADD CONSTRAINT "AiChatThread_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiChatMessage" ADD CONSTRAINT "AiChatMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "AiChatThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
