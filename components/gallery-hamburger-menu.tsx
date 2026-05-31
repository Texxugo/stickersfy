"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";

import { SuggestionModal } from "@/components/suggestion-modal";

type GalleryHamburgerMenuProps = {
  categories: string[];
  currentCategory: string;
  q: string;
  isAdmin: boolean;
  className?: string;
};

export function GalleryHamburgerMenu({
  categories,
  currentCategory,
  q,
  isAdmin,
  className
}: GalleryHamburgerMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#f2c8c8] bg-white/95 text-[#5f3535] shadow-soft transition hover:bg-[#fdf1f1] ${className ?? ""}`}
        aria-label="Abrir menu lateral"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && mounted
        ? createPortal(
        <div className="fixed inset-0 z-50 flex bg-black/35">
          <aside className="h-full w-[280px] overflow-y-auto border-r border-[#f2c8c8] bg-[#fff8f8] p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-title text-2xl">Menu</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#f2c8c8] text-[#5f3535] hover:bg-[#fdf1f1]"
                aria-label="Fechar menu lateral"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <Link
                href="/gallery"
                onClick={() => setOpen(false)}
                className="block rounded-xl border border-[#f2c8c8] bg-white px-3 py-2 text-sm font-semibold text-[#5f3535]"
              >
                Galeria
              </Link>
              {isAdmin ? (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="block rounded-xl border border-[#f2c8c8] bg-white px-3 py-2 text-sm font-semibold text-[#5f3535]"
                >
                  Acessar admin
                </Link>
              ) : null}
              <SuggestionModal
                className="flex w-full items-center gap-2 rounded-xl border border-[#f2c8c8] bg-white px-3 py-2 text-left text-sm font-semibold text-[#5f3535]"
              />
            </div>

            <div className="mt-5 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Categorias</p>
              <div className="space-y-2">
                <Link
                  href={`/gallery${q ? `?q=${encodeURIComponent(q)}` : ""}`}
                  onClick={() => setOpen(false)}
                  className={`block rounded-xl border px-3 py-2 text-sm font-semibold ${
                    !currentCategory
                      ? "border-[#f2c8c8] bg-[#f2c8c8] text-[#5f3535]"
                      : "border-[#f2c8c8] bg-white text-slate-700"
                  }`}
                >
                  Todas
                </Link>

                {categories.map((item) => (
                  <Link
                    key={item}
                    href={`/gallery?category=${encodeURIComponent(item)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                    onClick={() => setOpen(false)}
                    className={`block rounded-xl border px-3 py-2 text-sm font-semibold ${
                      currentCategory === item
                        ? "border-[#f2c8c8] bg-[#f2c8c8] text-[#5f3535]"
                        : "border-[#f2c8c8] bg-white text-slate-700"
                    }`}
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-full flex-1"
            aria-label="Fechar menu"
          />
        </div>,
        document.body
      )
        : null}
    </>
  );
}
