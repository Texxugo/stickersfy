import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { auth } from "@/auth";
import { Navbar } from "@/components/navbar";
import { StickerVariantPanel } from "@/components/sticker-variant-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAccessDecision } from "@/lib/access-control";
import { getStickerBySlug } from "@/lib/sticker-data";

export default async function StickerDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  const access = await getAccessDecision(session.user.email);
  if (!access.allowed) redirect("/no-access");

  const { slug } = await params;
  const sticker = await getStickerBySlug(slug);
  if (!sticker) notFound();

  return (
    <div className="min-h-screen">
      <Navbar email={session.user.email} />

      <main className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6">
        <Link
          href="/gallery"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-text"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar para galeria
        </Link>

        <Card>
          <CardContent className="space-y-5 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="font-title text-4xl leading-none">{sticker.title}</h1>
                <p className="mt-1 text-sm text-muted">{sticker.phrase}</p>
              </div>
              <Badge>{sticker.category}</Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted">
              <p className="rounded-lg bg-white/80 px-2 py-2">{sticker.width} x {sticker.height}px</p>
              <p className="rounded-lg bg-white/80 px-2 py-2">~{sticker.sizeKb}KB</p>
              <p className="rounded-lg bg-white/80 px-2 py-2">{sticker.format.toUpperCase()} transparente</p>
            </div>

            <StickerVariantPanel
              title={sticker.title}
              baseImageUrl={sticker.imageUrl}
              width={sticker.width}
              height={sticker.height}
              variants={sticker.variants}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
