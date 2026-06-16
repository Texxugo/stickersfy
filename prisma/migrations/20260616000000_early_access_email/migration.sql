-- CreateTable
CREATE TABLE "EarlyAccessEmail" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EarlyAccessEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EarlyAccessEmail_email_key" ON "EarlyAccessEmail"("email");

-- CreateIndex
CREATE INDEX "EarlyAccessEmail_createdAt_idx" ON "EarlyAccessEmail"("createdAt");
