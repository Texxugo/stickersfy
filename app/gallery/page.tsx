import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";

import { auth } from "@/auth";
import { Navbar } from "@/components/navbar";
import { StickerCard } from "@/components/sticker-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCategories, getPublishedStickers } from "@/lib/sticker-data";

export default async function GalleryPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const category = params.category?.trim() ?? "";

  const [stickers, categories] = await Promise.all([
    getPublishedStickers(q, category),
    getCategories()
  ]);

  return (
    <div className="min-h-screen">
      <Navbar email={session.user.email} />

      <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6">
        <section className="space-y-4 rounded-2xl border border-border bg-card/80 p-4 shadow-soft">
          <div>
            <h1 className="font-title text-4xl leading-none">Galeria de stickers</h1>
            <p className="text-sm text-muted">
              Mobile-first: copie ou baixe stickers de forma rápida para stories.
            </p>
          </div>

          <form className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                name="q"
                defaultValue={q}
                className="pl-9"
                placeholder="Busque por frase ou título"
              />
            </div>
            <Button type="submit">Buscar</Button>
          </form>

          <div className="flex flex-wrap gap-2">
            <Link href="/gallery">
              <Badge className={!category ? "bg-accent text-white border-accent" : ""}>
                Todas
              </Badge>
            </Link>
            {categories.map((item) => (
              <Link key={item} href={`/gallery?category=${encodeURIComponent(item)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}>
                <Badge className={category === item ? "bg-accent text-white border-accent" : ""}>
                  {item}
                </Badge>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {stickers.map((sticker) => (
            <StickerCard key={sticker.id} sticker={sticker} />
          ))}
        </section>

        {stickers.length === 0 ? (
          <p className="rounded-xl border border-border bg-card/70 p-4 text-sm text-muted">
            Nenhum sticker encontrado para esse filtro.
          </p>
        ) : null}
      </main>
    </div>
  );
}
