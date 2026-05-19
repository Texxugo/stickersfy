-- CreateEnum
CREATE TYPE "AccessStatus" AS ENUM ('ACTIVE', 'GRACE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('UNKNOWN', 'APPROVED', 'PAYMENT_FAILED', 'CANCELED', 'REFUNDED', 'CHARGEBACK');

-- CreateEnum
CREATE TYPE "WebhookProcessingStatus" AS ENUM ('PROCESSED', 'IGNORED', 'FAILED');

-- CreateTable
CREATE TABLE "CustomerAccess" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "accessStatus" "AccessStatus" NOT NULL DEFAULT 'BLOCKED',
    "billingStatus" "BillingStatus" NOT NULL DEFAULT 'UNKNOWN',
    "graceUntil" TIMESTAMP(3),
    "kiwifyCustomerId" TEXT,
    "kiwifyProductId" TEXT,
    "kiwifySubscriptionId" TEXT,
    "lastEventType" TEXT,
    "lastEventAt" TIMESTAMP(3),
    "lastApprovedAt" TIMESTAMP(3),
    "lastPaymentFailedAt" TIMESTAMP(3),
    "lastBlockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KiwifyWebhookDelivery" (
    "id" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "email" TEXT,
    "payload" JSONB NOT NULL,
    "processingStatus" "WebhookProcessingStatus" NOT NULL DEFAULT 'PROCESSED',
    "errorMessage" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "KiwifyWebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerAccess_email_key" ON "CustomerAccess"("email");

-- CreateIndex
CREATE UNIQUE INDEX "KiwifyWebhookDelivery_dedupeKey_key" ON "KiwifyWebhookDelivery"("dedupeKey");
