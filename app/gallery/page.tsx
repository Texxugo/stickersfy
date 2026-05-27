import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";

import { auth } from "@/auth";
import { Navbar } from "@/components/navbar";
import { StickerCard } from "@/components/sticker-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAccessDecision } from "@/lib/access-control";
import { getCategories, getPublishedStickers } from "@/lib/sticker-data";

export default async function GalleryPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  const access = await getAccessDecision(session.user.email);
  if (!access.allowed) redirect("/no-access");

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
            <h1 className="font-title text-4xl leading-none sm:text-5xl">Galeria de stickers</h1>
            <p className="text-base text-muted sm:text-lg">
              Mobile-first: copie ou baixe stickers de forma rapida para stories.
            </p>
          </div>

          <form className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#c87f7f]" />
              <Input
                name="q"
                defaultValue={q}
                className="h-12 border-[#f2c8c8] pl-10 text-base placeholder:text-slate-500 focus-visible:ring-[#f2c8c8]"
                placeholder="Busque por frase ou titulo"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="bg-[#f2c8c8] text-[#5f3535] hover:bg-[#e8b4b4] focus-visible:ring-[#f2c8c8]"
            >
              Buscar
            </Button>
          </form>

          <div className="rounded-xl border border-[#f2c8c8] bg-[#fdf5f5] p-2">
            <div className="flex flex-wrap gap-2">
              <Link href="/gallery">
                <Badge
                  className={`px-4 py-1.5 text-sm ${
                    !category
                      ? "border-[#f2c8c8] bg-[#f2c8c8] text-[#5f3535]"
                      : "border-[#f2c8c8] bg-white/90 text-slate-700 hover:bg-[#fdf1f1]"
                  }`}
                >
                  Todas
                </Badge>
              </Link>
              {categories.map((item) => (
                <Link
                  key={item}
                  href={`/gallery?category=${encodeURIComponent(item)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                >
                  <Badge
                    className={`px-4 py-1.5 text-sm ${
                      category === item
                        ? "border-[#f2c8c8] bg-[#f2c8c8] text-[#5f3535]"
                        : "border-[#f2c8c8] bg-white/90 text-slate-700 hover:bg-[#fdf1f1]"
                    }`}
                  >
                    {item}
                  </Badge>
                </Link>
              ))}
            </div>
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
