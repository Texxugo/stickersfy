import Link from "next/link";

import type { StickerItem } from "@/lib/sticker-data";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type StickerCardProps = {
  sticker: StickerItem;
};

export function StickerCard({ sticker }: StickerCardProps) {
  return (
    <Link href={`/gallery/${sticker.slug}`} className="group block">
      <Card className="overflow-hidden transition-transform duration-200 group-hover:-translate-y-1">
        <div className="relative flex aspect-square items-center justify-center bg-accentSoft">
          <img
            src={sticker.imageUrl}
            alt={sticker.title}
            className="h-28 w-28 object-contain"
          />
        </div>
        <div className="space-y-2 p-4">
          <Badge>{sticker.category}</Badge>
          <div>
            <h3 className="font-semibold text-text">{sticker.title}</h3>
            <p className="text-xs text-muted">{sticker.phrase}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
