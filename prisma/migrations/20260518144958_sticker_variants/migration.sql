-- CreateTable
CREATE TABLE "StickerVariant" (
    "id" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stickerId" TEXT NOT NULL,

    CONSTRAINT "StickerVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StickerVariant_stickerId_sortOrder_idx" ON "StickerVariant"("stickerId", "sortOrder");

-- AddForeignKey
ALTER TABLE "StickerVariant" ADD CONSTRAINT "StickerVariant_stickerId_fkey" FOREIGN KEY ("stickerId") REFERENCES "Sticker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
