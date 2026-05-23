"use client";

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

export function AdminCreateStickerForm({
  categories,
  action
}: AdminCreateStickerFormProps) {
  const hasCategories = categories.length > 0;

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            TÃ­tulo
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
          URL da imagem PNG ou SVG (Cloudinary)
        </span>
        <Input
          name="imageUrl"
          type="url"
          required
          placeholder="https://res.cloudinary.com/.../sticker.png ou .svg"
        />
      </label>

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
          <Input name="width" type="number" min={128} defaultValue={128} required />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Altura
          </span>
          <Input name="height" type="number" min={128} defaultValue={128} required />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-[160px_1fr] sm:items-end">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Tamanho KB
          </span>
          <Input name="sizeKb" type="number" min={1} max={1024} defaultValue={120} required />
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
