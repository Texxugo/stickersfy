-- CreateIndex
CREATE INDEX "Sticker_published_createdAt_idx" ON "Sticker"("published", "createdAt");

-- CreateIndex
CREATE INDEX "Sticker_categoryId_idx" ON "Sticker"("categoryId");
