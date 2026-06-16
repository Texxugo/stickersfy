import { prisma } from "@/lib/db";

export type StickerItem = {
  id: string;
  slug: string;
  title: string;
  phrase: string;
  category: string;
  imageUrl: string;
  format: "png" | "svg";
  width: number;
  height: number;
  sizeKb: number;
  variants: StickerVariantItem[];
};

export type StickerVariantItem = {
  id: string;
  colorHex: string;
  imageUrl: string;
  format: "png" | "svg";
};

const fallbackStickers: StickerItem[] = [
  {
    id: "fallback-1",
    slug: "bom-dia-brilho",
    title: "Bom dia brilho",
    phrase: "Bom dia",
    category: "Bom dia",
    imageUrl: "/stickers/bom-dia.png",
    format: "png",
    width: 128,
    height: 128,
    sizeKb: 14,
    variants: [
      {
        id: "fallback-1-v1",
        colorHex: "#F97316",
        imageUrl: "/stickers/bom-dia.png",
        format: "png"
      }
    ]
  },
  {
    id: "fallback-2",
    slug: "boa-tarde-leveza",
    title: "Boa tarde leveza",
    phrase: "Boa tarde",
    category: "Boa tarde",
    imageUrl: "/stickers/boa-tarde.png",
    format: "png",
    width: 128,
    height: 128,
    sizeKb: 16,
    variants: [
      {
        id: "fallback-2-v1",
        colorHex: "#22C55E",
        imageUrl: "/stickers/boa-tarde.png",
        format: "png"
      }
    ]
  },
  {
    id: "fallback-3",
    slug: "boa-noite-serena",
    title: "Boa noite serena",
    phrase: "Boa noite",
    category: "Boa noite",
    imageUrl: "/stickers/boa-noite.png",
    format: "png",
    width: 128,
    height: 128,
    sizeKb: 13,
    variants: [
      {
        id: "fallback-3-v1",
        colorHex: "#3B82F6",
        imageUrl: "/stickers/boa-noite.png",
        format: "png"
      }
    ]
  }
];

function shouldUseDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export const GALLERY_PAGE_SIZE = 48;

export type PublishedStickersResult = {
  items: StickerItem[];
  hasMore: boolean;
};

export async function getPublishedStickers(
  query?: string,
  category?: string,
  limit: number = GALLERY_PAGE_SIZE
): Promise<PublishedStickersResult> {
  const take = Math.max(1, limit);

  if (shouldUseDatabase()) {
    try {
      const rows = await prisma.sticker.findMany({
        where: {
          published: true,
          ...(query
            ? {
                OR: [
                  {
                    title: {
                      contains: query,
                      mode: "insensitive"
                    }
                  },
                  {
                    phrase: {
                      contains: query,
                      mode: "insensitive"
                    }
                  }
                ]
              }
            : {}),
          ...(category ? { category: { name: category } } : {})
        },
        include: {
          category: true,
          variants: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        // Busca um item a mais para saber se ha proxima pagina.
        take: take + 1
      });

      const hasMore = rows.length > take;
      const visible = hasMore ? rows.slice(0, take) : rows;
      return { items: visible.map(mapStickerRow), hasMore };
    } catch {
      return fallbackFilter(query, category, take);
    }
  }

  return fallbackFilter(query, category, take);
}

export async function getStickerBySlug(slug: string) {
  if (shouldUseDatabase()) {
    try {
      const row = await prisma.sticker.findUnique({
        where: {
          slug
        },
        include: {
          category: true,
          variants: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
          }
        }
      });

      if (!row || !row.published) return null;

      return mapStickerRow(row);
    } catch {
      return fallbackStickers.find((item) => item.slug === slug) ?? null;
    }
  }

  return fallbackStickers.find((item) => item.slug === slug) ?? null;
}

export async function getCategories() {
  if (shouldUseDatabase()) {
    try {
      const rows = await prisma.category.findMany({
        where: {
          stickers: {
            some: {
              published: true
            }
          }
        },
        orderBy: {
          name: "asc"
        }
      });

      if (rows.length > 0) {
        return rows.map((row) => row.name);
      }
    } catch {
      return ["Bom dia", "Boa tarde", "Boa noite"];
    }
  }

  return ["Bom dia", "Boa tarde", "Boa noite"];
}

function fallbackFilter(
  query?: string,
  category?: string,
  take: number = GALLERY_PAGE_SIZE
): PublishedStickersResult {
  const normalizedQuery = query?.trim().toLowerCase();
  const filtered = fallbackStickers.filter((sticker) => {
    const byCategory = category ? sticker.category === category : true;
    const byQuery = normalizedQuery
      ? `${sticker.title} ${sticker.phrase}`.toLowerCase().includes(normalizedQuery)
      : true;
    return byCategory && byQuery;
  });

  return {
    items: filtered.slice(0, take),
    hasMore: filtered.length > take
  };
}

function detectStickerFormat(imageUrl: string): "png" | "svg" {
  const normalized = imageUrl.toLowerCase();
  if (normalized.includes(".svg")) return "svg";
  return "png";
}

type StickerRow = {
  id: string;
  slug: string;
  title: string;
  phrase: string;
  imageUrl: string;
  width: number;
  height: number;
  sizeKb: number;
  category: { name: string };
  variants: Array<{
    id: string;
    colorHex: string;
    imageUrl: string;
  }>;
};

function mapStickerRow(row: StickerRow): StickerItem {
  const variants = row.variants.map((variant) => ({
    id: variant.id,
    colorHex: variant.colorHex,
    imageUrl: variant.imageUrl,
    format: detectStickerFormat(variant.imageUrl)
  }));

  const previewImageUrl = variants[0]?.imageUrl ?? row.imageUrl;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    phrase: row.phrase,
    category: row.category.name,
    imageUrl: previewImageUrl,
    format: detectStickerFormat(previewImageUrl),
    width: row.width,
    height: row.height,
    sizeKb: row.sizeKb,
    variants
  };
}
