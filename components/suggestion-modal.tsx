"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Lightbulb, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type SuggestionModalProps = {
  className?: string;
  onOpenChange?: (open: boolean) => void;
};

export function SuggestionModal({ className, onOpenChange }: SuggestionModalProps) {
  const [open, setOpenState] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const setOpen = (value: boolean) => {
    setOpenState(value);
    onOpenChange?.(value);
    if (value) {
      setStatus("idle");
      setError("");
    }
  };

  async function submitSuggestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError("");

    const response = await fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, message })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Nao foi possivel enviar agora.");
      setStatus("error");
      return;
    }

    setName("");
    setMessage("");
    setStatus("sent");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-text transition hover:bg-accentSoft"
        }
      >
        <Lightbulb className="h-4 w-4" />
        Sugerir frase
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-md rounded-xl border border-[#f2c8c8] bg-[#fff8f8] p-4 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-title text-3xl leading-none">Sugerir frase</h2>
                <p className="text-sm text-muted">Envie uma ideia para novos stickers.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#f2c8c8] text-[#5f3535] hover:bg-[#fdf1f1]"
                aria-label="Fechar sugestao"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {status === "sent" ? (
              <div className="mt-4 rounded-xl border border-[#f2c8c8] bg-white p-4">
                <p className="text-sm font-semibold text-[#5f3535]">
                  Sugestao enviada com sucesso.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-3"
                  onClick={() => setOpen(false)}
                >
                  Fechar
                </Button>
              </div>
            ) : (
              <form onSubmit={submitSuggestion} className="mt-4 space-y-3">
                <label className="block space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Nome
                  </span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    maxLength={80}
                    className="flex h-11 w-full rounded-xl border border-[#f2c8c8] bg-white px-4 text-sm text-text shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2c8c8]"
                    placeholder="Seu nome"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Sugestao
                  </span>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    required
                    maxLength={500}
                    rows={5}
                    className="w-full resize-none rounded-xl border border-[#f2c8c8] bg-white px-4 py-3 text-sm text-text shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2c8c8]"
                    placeholder="Escreva a frase ou ideia de sticker"
                  />
                </label>

                {error ? <p className="text-sm text-warning">{error}</p> : null}

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={status === "sending"}
                    className="bg-[#f2c8c8] text-[#5f3535] hover:bg-[#e8b4b4] focus-visible:ring-[#f2c8c8]"
                  >
                    {status === "sending" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando
                      </>
                    ) : (
                      "Enviar"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
