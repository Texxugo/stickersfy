-- CreateEnum
CREATE TYPE "MagicLinkBridgeStatus" AS ENUM ('PENDING', 'APPROVED', 'CONSUMED', 'EXPIRED');

-- CreateTable
CREATE TABLE "MagicLinkBridge" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "status" "MagicLinkBridgeStatus" NOT NULL DEFAULT 'PENDING',
    "exchangeCode" TEXT,
    "approvedAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MagicLinkBridge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MagicLinkBridge_exchangeCode_key" ON "MagicLinkBridge"("exchangeCode");

-- CreateIndex
CREATE INDEX "MagicLinkBridge_email_createdAt_idx" ON "MagicLinkBridge"("email", "createdAt");

-- CreateIndex
CREATE INDEX "MagicLinkBridge_expiresAt_idx" ON "MagicLinkBridge"("expiresAt");
