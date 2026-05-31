import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin-emails";
import { isPanelBypassEnabled } from "@/lib/panel-bypass";
import { Navbar } from "@/components/navbar";
import { AdminCreateStickerForm } from "@/components/admin-create-sticker-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { prisma } from "@/lib/db";

const INITIAL_CATEGORIES = ["Bom dia", "Boa tarde", "Boa noite"];

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams
}: {
  searchParams?: Promise<{ catalogCategory?: string }>;
}) {
  const session = await requireAdminSession();
  const dbConfigured = Boolean(process.env.DATABASE_URL);

  const [stickers, dynamicCategories] = dbConfigured
    ? await Promise.all([
        prisma.sticker.findMany({
          include: {
            category: true,
            variants: {
              orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
            }
          },
          orderBy: { createdAt: "desc" }
        }),
        prisma.category.findMany({
          include: {
            _count: {
              select: { stickers: true }
            }
          },
          orderBy: { name: "asc" }
        })
      ])
    : [[], []];
  const suggestions = dbConfigured ? await getPhraseSuggestions() : [];

  const categories = dbConfigured
    ? dynamicCategories.map((category) => category.name)
    : INITIAL_CATEGORIES;
  const params = await searchParams;
  const selectedCatalogCategory = params?.catalogCategory?.trim() ?? "";
  const filteredStickers = selectedCatalogCategory
    ? stickers.filter((sticker) => sticker.category.name === selectedCatalogCategory)
    : stickers;

  async function createSticker(formData: FormData) {
    "use server";

    await requireAdminSession();
    assertDatabaseConfigured();

    const title = String(formData.get("title") ?? "").trim();
    const phrase = String(formData.get("phrase") ?? "").trim();
    const imageUrl = String(formData.get("imageUrl") ?? "").trim();
    const categoryName = String(formData.get("category") ?? "").trim();
    const width = Number(formData.get("width") ?? 128);
    const height = Number(formData.get("height") ?? 128);
    const sizeKb = Number(formData.get("sizeKb") ?? 120);

    if (!title || !phrase || !imageUrl || !categoryName) {
      throw new Error("Dados obrigatorios ausentes para publicar sticker.");
    }

    const lowerImageUrl = imageUrl.toLowerCase();
    const isPng = lowerImageUrl.includes(".png");
    const isSvg = lowerImageUrl.includes(".svg");
    if (!isPng && !isSvg) {
      throw new Error("Somente PNG ou SVG e permitido para sticker.");
    }

    if (width < 128 || height < 128) {
      throw new Error("Dimensao minima deve ser 128x128.");
    }

    if (sizeKb < 1 || sizeKb > 1024) {
      throw new Error("Tamanho em KB invalido.");
    }

    const categorySlug = slugify(categoryName);
    const category = await prisma.category.upsert({
      where: { slug: categorySlug },
      update: { name: categoryName },
      create: {
        name: categoryName,
        slug: categorySlug
      }
    });

    const slug = await buildUniqueStickerSlug(title);
    await prisma.sticker.create({
      data: {
        slug,
        title,
        phrase,
        imageUrl,
        width,
        height,
        sizeKb,
        published: true,
        categoryId: category.id
      }
    });

    revalidatePath("/gallery");
    revalidatePath("/admin");
  }

  async function togglePublish(formData: FormData) {
    "use server";

    await requireAdminSession();
    assertDatabaseConfigured();

    const id = String(formData.get("id") ?? "");
    const published = String(formData.get("published") ?? "") === "true";
    if (!id) throw new Error("ID do sticker nao informado.");

    await prisma.sticker.update({
      where: { id },
      data: { published: !published }
    });

    revalidatePath("/gallery");
    revalidatePath("/admin");
  }

  async function deleteSticker(formData: FormData) {
    "use server";

    await requireAdminSession();
    assertDatabaseConfigured();

    const id = String(formData.get("id") ?? "");
    if (!id) throw new Error("ID do sticker nao informado.");

    await prisma.sticker.delete({
      where: { id }
    });

    revalidatePath("/gallery");
    revalidatePath("/admin");
  }

  async function createVariant(formData: FormData) {
    "use server";

    await requireAdminSession();
    assertDatabaseConfigured();

    const stickerId = String(formData.get("stickerId") ?? "").trim();
    const colorHex = String(formData.get("colorHex") ?? "").trim().toUpperCase();
    const imageUrl = String(formData.get("imageUrl") ?? "").trim();
    const sortOrder = Number(formData.get("sortOrder") ?? 0);

    if (!stickerId || !colorHex || !imageUrl) {
      throw new Error("Dados obrigatorios ausentes para criar variante.");
    }

    const hexPattern = /^#(?:[0-9A-F]{3}|[0-9A-F]{6})$/i;
    if (!hexPattern.test(colorHex)) {
      throw new Error("Cor invalida. Use formato #RRGGBB.");
    }

    const lowerImageUrl = imageUrl.toLowerCase();
    if (!lowerImageUrl.includes(".png") && !lowerImageUrl.includes(".svg")) {
      throw new Error("Variante aceita apenas PNG ou SVG.");
    }

    await prisma.stickerVariant.create({
      data: {
        stickerId,
        colorHex,
        imageUrl,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0
      }
    });

    revalidatePath("/gallery");
    revalidatePath("/admin");
  }

  async function deleteVariant(formData: FormData) {
    "use server";

    await requireAdminSession();
    assertDatabaseConfigured();

    const id = String(formData.get("id") ?? "").trim();
    if (!id) throw new Error("ID da variante nao informado.");

    await prisma.stickerVariant.delete({
      where: { id }
    });

    revalidatePath("/gallery");
    revalidatePath("/admin");
  }

  async function createCategory(formData: FormData) {
    "use server";

    await requireAdminSession();
    assertDatabaseConfigured();

    const name = String(formData.get("name") ?? "").trim();
    if (!name) throw new Error("Nome da categoria nao informado.");

    const slug = slugify(name);
    if (!slug) throw new Error("Nome da categoria invalido.");

    await prisma.category.upsert({
      where: { slug },
      update: { name },
      create: { name, slug }
    });

    revalidatePath("/admin");
  }

  async function updateCategory(formData: FormData) {
    "use server";

    await requireAdminSession();
    assertDatabaseConfigured();

    const id = String(formData.get("id") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    if (!id || !name) throw new Error("Dados da categoria incompletos.");

    const slug = slugify(name);
    if (!slug) throw new Error("Nome da categoria invalido.");

    const conflict = await prisma.category.findFirst({
      where: {
        slug,
        NOT: { id }
      },
      select: { id: true }
    });
    if (conflict) throw new Error("Ja existe categoria com esse nome.");

    await prisma.category.update({
      where: { id },
      data: { name, slug }
    });

    revalidatePath("/admin");
    revalidatePath("/gallery");
  }

  async function deleteCategory(formData: FormData) {
    "use server";

    await requireAdminSession();
    assertDatabaseConfigured();

    const id = String(formData.get("id") ?? "").trim();
    if (!id) throw new Error("ID da categoria nao informado.");

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { stickers: true }
        }
      }
    });

    if (!category) return;
    if (category._count.stickers > 0) {
      throw new Error("Nao e possivel excluir categoria com stickers vinculados.");
    }

    await prisma.category.delete({
      where: { id }
    });

    revalidatePath("/admin");
    revalidatePath("/gallery");
  }

  return (
    <div className="min-h-screen">
      <Navbar email={session.email} />

      <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6">
        <section className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-title text-4xl leading-none">Painel admin</h1>
            <p className="text-sm text-muted">
              Gerencie stickers e categorias da plataforma.
            </p>
          </div>
          <Link href="/gallery" className="text-sm font-semibold text-accent">
            Ver galeria
          </Link>
        </section>

        {!dbConfigured ? (
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-warning">
                Configure `DATABASE_URL` para habilitar publicacao de stickers.
              </p>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Sugestoes de frases</CardTitle>
            <CardDescription>
              Mensagens enviadas pelos usuarios. Somente admins conseguem ver esta lista.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {suggestions.length > 0 ? (
              <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="rounded-xl border border-border bg-white/70 p-3"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-semibold text-text">{suggestion.name}</p>
                      <p className="text-xs text-muted">
                        {suggestion.createdAt.toLocaleString("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short"
                        })}
                      </p>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-text">
                      {suggestion.message}
                    </p>
                    {suggestion.userEmail ? (
                      <p className="mt-2 text-xs text-muted">Login: {suggestion.userEmail}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Nenhuma sugestao enviada ainda.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categorias</CardTitle>
            <CardDescription>
              Crie, edite e exclua categorias. Categorias com stickers vinculados nao podem ser excluidas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={createCategory} className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="w-full space-y-2 sm:max-w-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Nova categoria
                </span>
                <input
                  name="name"
                  required
                  placeholder="Ex.: Bom dia"
                  className="flex h-11 w-full rounded-xl border border-border bg-white/70 px-4 py-2 text-sm text-text shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                />
              </label>
              <Button
                type="submit"
                className="bg-[#f2c8c8] text-[#5f3535] hover:bg-[#e8b4b4] focus-visible:ring-[#f2c8c8]"
              >
                Criar categoria
              </Button>
            </form>

            {dynamicCategories.length > 0 ? (
              <div className="rounded-xl border border-border bg-white/40 p-2">
                <div className="mb-2 px-1 text-xs text-muted">
                  {dynamicCategories.length} categoria(s) cadastrada(s)
                </div>
                <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
                  {dynamicCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex flex-col gap-2 rounded-xl border border-border bg-white/70 p-2 sm:flex-row sm:items-end sm:justify-between"
                    >
                      <form action={updateCategory} className="flex w-full flex-col gap-2 sm:flex-row sm:items-end">
                        <input type="hidden" name="id" value={category.id} />
                        <label className="w-full space-y-1 sm:max-w-sm">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                            Nome
                          </span>
                          <input
                            name="name"
                            required
                            defaultValue={category.name}
                            className="flex h-10 w-full rounded-xl border border-border bg-white/70 px-4 py-2 text-sm text-text shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                          />
                        </label>
                        <div className="flex gap-2">
                          <Button type="submit" variant="secondary">
                            Salvar
                          </Button>
                        </div>
                      </form>

                      <div className="flex items-center gap-2">
                        <Badge>{category._count.stickers} sticker(s)</Badge>
                        <form action={deleteCategory}>
                          <input type="hidden" name="id" value={category.id} />
                          <Button
                            type="submit"
                            variant="secondary"
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            Excluir
                          </Button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">Nenhuma categoria cadastrada ainda.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Novo sticker</CardTitle>
            <CardDescription>
              O upload no Cloudinary pode ser feito antes; aqui voce publica o registro na plataforma (PNG ou SVG).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminCreateStickerForm categories={categories} action={createSticker} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Catalogo de stickers</CardTitle>
            <CardDescription>
              {stickers.length} sticker(s) cadastrados. Configure variantes com bolinhas de cor.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <form className="rounded-xl border border-border bg-white/50 p-3" action="/admin">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <label className="w-full space-y-1 sm:max-w-sm">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Filtrar por categoria
                  </span>
                  <select
                    name="catalogCategory"
                    defaultValue={selectedCatalogCategory}
                    className="flex h-10 w-full rounded-xl border border-border bg-white/80 px-3 text-sm text-text shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <option value="">Todas as categorias</option>
                    {dynamicCategories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex gap-2">
                  <Button type="submit" variant="secondary">
                    Filtrar
                  </Button>
                  <Link
                    href="/admin"
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-white/80 px-4 text-sm font-semibold text-text hover:bg-accentSoft"
                  >
                    Limpar
                  </Link>
                </div>
              </div>
            </form>

            {filteredStickers.length === 0 ? (
              <p className="text-sm text-muted">Ainda nao ha stickers cadastrados.</p>
            ) : (
              <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
                {filteredStickers.map((sticker) => (
                  <div key={sticker.id} className="rounded-xl border border-border bg-white/70 p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={sticker.imageUrl}
                          alt={sticker.title}
                          className="h-12 w-12 rounded-lg bg-accentSoft p-1 object-contain"
                        />
                        <div>
                          <p className="font-semibold text-text">{sticker.title}</p>
                          <p className="text-xs text-muted">{sticker.phrase}</p>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <Badge>{sticker.category.name}</Badge>
                            <Badge>{sticker.published ? "Publicado" : "Oculto"}</Badge>
                            <Badge>
                              {sticker.imageUrl.toLowerCase().includes(".svg") ? "SVG" : "PNG"}
                            </Badge>
                          </div>
                          {sticker.variants.length > 0 ? (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {sticker.variants.map((variant) => (
                                <span
                                  key={variant.id}
                                  className="h-4 w-4 rounded-full border border-white shadow"
                                  style={{ backgroundColor: variant.colorHex }}
                                  title={`${variant.colorHex}`}
                                />
                              ))}
                            </div>
                          ) : (
                            <p className="mt-2 text-xs text-warning">Sem variantes configuradas.</p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 self-start">
                        <form action={togglePublish}>
                          <input type="hidden" name="id" value={sticker.id} />
                          <input type="hidden" name="published" value={String(sticker.published)} />
                          <Button type="submit" variant={sticker.published ? "secondary" : "primary"}>
                            {sticker.published ? "Despublicar" : "Publicar"}
                          </Button>
                        </form>

                        <form action={deleteSticker}>
                          <input type="hidden" name="id" value={sticker.id} />
                          <Button
                            type="submit"
                            variant="secondary"
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            Excluir
                          </Button>
                        </form>
                      </div>
                    </div>

                    <details className="mt-2 rounded-xl border border-border bg-white/60 p-3">
                      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-muted">
                        Gerenciar variantes ({sticker.variants.length})
                      </summary>

                      <form action={createVariant} className="mt-3 grid gap-2 sm:grid-cols-4">
                        <input type="hidden" name="stickerId" value={sticker.id} />
                        <label className="space-y-1">
                          <span className="text-[11px] uppercase tracking-wide text-muted">Cor</span>
                          <input
                            name="colorHex"
                            type="text"
                            required
                            placeholder="#F97316"
                            className="flex h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                          />
                        </label>
                        <label className="space-y-1 sm:col-span-2">
                          <span className="text-[11px] uppercase tracking-wide text-muted">
                            URL da variante
                          </span>
                          <input
                            name="imageUrl"
                            type="url"
                            required
                            placeholder="https://res.cloudinary.com/.../sticker-rosa.svg"
                            className="flex h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="text-[11px] uppercase tracking-wide text-muted">Ordem</span>
                          <input
                            name="sortOrder"
                            type="number"
                            defaultValue={0}
                            className="flex h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                          />
                        </label>
                        <div className="sm:col-span-4">
                          <Button type="submit" variant="secondary">
                            Adicionar variante
                          </Button>
                        </div>
                      </form>

                      {sticker.variants.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          {sticker.variants.map((variant) => (
                            <div
                              key={variant.id}
                              className="flex flex-col gap-2 rounded-lg border border-border bg-white/80 p-2 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-6 w-6 rounded-full border border-white shadow"
                                  style={{ backgroundColor: variant.colorHex }}
                                />
                                <span className="text-xs font-semibold text-text">{variant.colorHex}</span>
                                <span className="text-xs text-muted">
                                  {variant.imageUrl.toLowerCase().includes(".svg") ? "SVG" : "PNG"}
                                </span>
                              </div>
                              <form action={deleteVariant}>
                                <input type="hidden" name="id" value={variant.id} />
                                <Button
                                  type="submit"
                                  variant="secondary"
                                  className="border-red-300 text-red-700 hover:bg-red-50"
                                >
                                  Excluir variante
                                </Button>
                              </form>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </details>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

async function requireAdminSession() {
  if (isPanelBypassEnabled()) {
    const fallbackEmail =
      process.env.ADMIN_EMAIL?.trim() ||
      process.env.ADMIN_EMAILS?.split(",")[0]?.trim() ||
      "admin@local.test";
    return { email: fallbackEmail };
  }

  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const email = session.user.email.toLowerCase();
  const anyAdminConfigured = Boolean(
    (process.env.ADMIN_EMAIL ?? "").trim() || (process.env.ADMIN_EMAILS ?? "").trim()
  );
  if (anyAdminConfigured && !isAdminEmail(email)) {
    redirect("/gallery");
  }

  return { email: session.user.email };
}

function assertDatabaseConfigured() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL nao configurada.");
  }
}

async function getPhraseSuggestions() {
  try {
    return await prisma.phraseSuggestion.findMany({
      orderBy: { createdAt: "desc" },
      take: 50
    });
  } catch {
    return [];
  }
}

async function buildUniqueStickerSlug(title: string) {
  const base = slugify(title);
  let candidate = base;
  let counter = 2;

  while (true) {
    const exists = await prisma.sticker.findUnique({
      where: { slug: candidate },
      select: { id: true }
    });

    if (!exists) return candidate;

    candidate = `${base}-${counter}`;
    counter += 1;
  }
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}
