"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AdminCreateStickerFormProps = {
  categories: string[];
  action: (formData: FormData) => Promise<void>;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      className="w-full bg-[#f2c8c8] text-[#5f3535] hover:bg-[#e8b4b4] focus-visible:ring-[#f2c8c8] sm:w-auto"
    >
      {pending ? "Publicando..." : "Publicar sticker"}
    </Button>
  );
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image-load-failed"));
    image.src = src;
  });
}

export function AdminCreateStickerForm({
  categories,
  action
}: AdminCreateStickerFormProps) {
  const hasCategories = categories.length > 0;

  const [imageUrl, setImageUrl] = useState("");
  const [width, setWidth] = useState("512");
  const [height, setHeight] = useState("512");
  const [sizeKb, setSizeKb] = useState("120");
  const [previewOk, setPreviewOk] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState(false);

  // Detecta dimensoes e tamanho automaticamente quando a URL muda (best-effort).
  useEffect(() => {
    const trimmed = imageUrl.trim();
    setPreviewOk(false);
    setDetected(false);

    if (!/^https?:\/\//i.test(trimmed)) {
      setDetecting(false);
      return;
    }

    let cancelled = false;
    setDetecting(true);

    const timer = setTimeout(async () => {
      // Dimensoes via <img> (nao depende de CORS).
      try {
        const image = await loadImage(trimmed);
        if (!cancelled) {
          if (image.naturalWidth) setWidth(String(image.naturalWidth));
          if (image.naturalHeight) setHeight(String(image.naturalHeight));
          setPreviewOk(true);
          setDetected(true);
        }
      } catch {
        // URL nao carregou como imagem; segue com digitacao manual.
      }

      // Tamanho via fetch (Cloudinary permite). Best-effort.
      try {
        const response = await fetch(trimmed);
        const blob = await response.blob();
        if (!cancelled && blob.size > 0) {
          setSizeKb(String(Math.max(1, Math.round(blob.size / 1024))));
          setDetected(true);
        }
      } catch {
        // Mantem o valor atual de tamanho.
      }

      if (!cancelled) setDetecting(false);
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [imageUrl]);

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Título
          </span>
          <Input name="title" required placeholder="Bom dia brilho" />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Frase
          </span>
          <Input name="phrase" required placeholder="Bom dia" />
        </label>
      </div>

      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          URL da imagem (PNG recomendado, ou SVG) — Cloudinary
        </span>
        <Input
          name="imageUrl"
          type="url"
          required
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          placeholder="https://res.cloudinary.com/.../sticker.png"
        />
        <span className="block text-[11px] text-muted">
          {detecting
            ? "Detectando dimensões e tamanho..."
            : detected
              ? "Dimensões e tamanho preenchidos automaticamente (você pode ajustar)."
              : "Cole a URL para preencher dimensões e tamanho automaticamente. PNG mantém a máxima qualidade na cópia."}
        </span>
      </label>

      {previewOk ? (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-white/60 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl.trim()}
            alt="Pré-visualização do sticker"
            loading="lazy"
            decoding="async"
            className="h-16 w-16 rounded-lg bg-accentSoft p-1 object-contain"
          />
          <span className="text-xs text-muted">
            Pré-visualização — {width} x {height}px, ~{sizeKb}KB
          </span>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-4">
        <label className="space-y-2 sm:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Categoria
          </span>
          <select
            name="category"
            defaultValue={categories[0] ?? ""}
            disabled={!hasCategories}
            className="flex h-11 w-full rounded-xl border border-border bg-white/70 px-4 py-2 text-sm text-text shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {hasCategories ? (
              categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))
            ) : (
              <option value="">Crie uma categoria primeiro</option>
            )}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Largura
          </span>
          <Input
            name="width"
            type="number"
            min={128}
            required
            value={width}
            onChange={(event) => setWidth(event.target.value)}
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Altura
          </span>
          <Input
            name="height"
            type="number"
            min={128}
            required
            value={height}
            onChange={(event) => setHeight(event.target.value)}
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-[160px_1fr] sm:items-end">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Tamanho KB
          </span>
          <Input
            name="sizeKb"
            type="number"
            min={1}
            required
            value={sizeKb}
            onChange={(event) => setSizeKb(event.target.value)}
          />
        </label>
        {hasCategories ? (
          <SubmitButton />
        ) : (
          <p className="text-xs text-warning">
            Sem categorias ativas. Crie uma categoria para publicar stickers.
          </p>
        )}
      </div>
    </form>
  );
}
