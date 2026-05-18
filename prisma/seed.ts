import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const baseCategories = [
    { name: "Bom dia", slug: "bom-dia" },
    { name: "Boa tarde", slug: "boa-tarde" },
    { name: "Boa noite", slug: "boa-noite" }
  ];

  for (const category of baseCategories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category
    });
  }

  const categoryMap = Object.fromEntries(
    (
      await prisma.category.findMany({
        where: { slug: { in: baseCategories.map((c) => c.slug) } }
      })
    ).map((c) => [c.slug, c.id])
  );

  const stickers = [
    {
      slug: "bom-dia-brilho",
      title: "Bom dia brilho",
      phrase: "Bom dia",
      categorySlug: "bom-dia",
      imageUrl: "/stickers/bom-dia.png",
      width: 128,
      height: 128,
      sizeKb: 14
    },
    {
      slug: "boa-tarde-leveza",
      title: "Boa tarde leveza",
      phrase: "Boa tarde",
      categorySlug: "boa-tarde",
      imageUrl: "/stickers/boa-tarde.png",
      width: 128,
      height: 128,
      sizeKb: 16
    },
    {
      slug: "boa-noite-serena",
      title: "Boa noite serena",
      phrase: "Boa noite",
      categorySlug: "boa-noite",
      imageUrl: "/stickers/boa-noite.png",
      width: 128,
      height: 128,
      sizeKb: 13
    }
  ];

  for (const item of stickers) {
    await prisma.sticker.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        phrase: item.phrase,
        imageUrl: item.imageUrl,
        width: item.width,
        height: item.height,
        sizeKb: item.sizeKb,
        published: true,
        categoryId: categoryMap[item.categorySlug]
      },
      create: {
        slug: item.slug,
        title: item.title,
        phrase: item.phrase,
        imageUrl: item.imageUrl,
        width: item.width,
        height: item.height,
        sizeKb: item.sizeKb,
        published: true,
        categoryId: categoryMap[item.categorySlug]
      }
    });
  }

  const stickerRows = await prisma.sticker.findMany({
    where: {
      slug: {
        in: stickers.map((item) => item.slug)
      }
    },
    select: {
      id: true,
      slug: true
    }
  });

  const stickerBySlug = Object.fromEntries(stickerRows.map((row) => [row.slug, row.id]));

  const defaultVariants = [
    { stickerSlug: "bom-dia-brilho", colorHex: "#F97316", imageUrl: "/stickers/bom-dia.png" },
    { stickerSlug: "boa-tarde-leveza", colorHex: "#22C55E", imageUrl: "/stickers/boa-tarde.png" },
    { stickerSlug: "boa-noite-serena", colorHex: "#3B82F6", imageUrl: "/stickers/boa-noite.png" }
  ];

  for (const variant of defaultVariants) {
    const stickerId = stickerBySlug[variant.stickerSlug];
    if (!stickerId) continue;

    const exists = await prisma.stickerVariant.findFirst({
      where: {
        stickerId,
        colorHex: variant.colorHex
      },
      select: { id: true }
    });

    if (!exists) {
      await prisma.stickerVariant.create({
        data: {
          stickerId,
          colorHex: variant.colorHex,
          imageUrl: variant.imageUrl,
          sortOrder: 0
        }
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
