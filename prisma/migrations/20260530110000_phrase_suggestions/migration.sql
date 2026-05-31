CREATE TABLE "PhraseSuggestion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "userEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhraseSuggestion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PhraseSuggestion_createdAt_idx" ON "PhraseSuggestion"("createdAt");
