"use client";

import { useMemo, useState } from "react";

import type { StickerVariantItem } from "@/lib/sticker-data";
import { StickerActions } from "@/components/sticker-actions";

type StickerVariantPanelProps = {
  title: string;
  baseImageUrl: string;
  width: number;
  height: number;
  variants: StickerVariantItem[];
};

export function StickerVariantPanel({
  title,
  baseImageUrl,
  width,
  height,
  variants
}: StickerVariantPanelProps) {
  const selectedByDefault = variants[0] ?? null;
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    selectedByDefault?.id ?? null
  );

  const selectedVariant = useMemo(
    () => variants.find((variant) => variant.id === selectedVariantId) ?? null,
    [selectedVariantId, variants]
  );

  const currentImageUrl = selectedVariant?.imageUrl ?? baseImageUrl;
  const previewWidth = Math.min(Math.max(width * 3.4, 260), 430);
  const previewHeight = Math.min(Math.max(height * 3.4, 260), 430);

  return (
    <div className="space-y-4">
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-[radial-gradient(circle_at_30%_20%,#e2d8c5_0%,#c3b79f_55%,#a89b84_100%)]">
        <img
          src={currentImageUrl}
          alt={title}
          className="object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.65)] [filter:drop-shadow(0_0_10px_rgba(255,255,255,0.65))_drop-shadow(0_0_10px_rgba(0,0,0,0.38))]"
          style={{ width: previewWidth, height: previewHeight }}
        />
      </div>

      {variants.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Variantes
          </p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => {
              const active = selectedVariantId === variant.id;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedVariantId(variant.id)}
                  className={`h-8 w-8 rounded-full border-2 transition ${
                    active ? "border-text scale-110" : "border-white"
                  }`}
                  style={{ backgroundColor: variant.colorHex }}
                  title={`Variante ${variant.colorHex}`}
                  aria-label={`Selecionar variante ${variant.colorHex}`}
                />
              );
            })}
          </div>
        </div>
      ) : null}

      <StickerActions imageUrl={currentImageUrl} width={width} height={height} />
    </div>
  );
}
