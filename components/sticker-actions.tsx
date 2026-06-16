"use client";

import { useEffect, useState } from "react";
import { Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

type StickerActionsProps = {
  imageUrl: string;
  width: number;
  height: number;
};

export function StickerActions({ imageUrl, width, height }: StickerActionsProps) {
  const [message, setMessage] = useState<string>("");
  const [prepared, setPrepared] = useState<{
    sourceBlob: Blob | null;
    sourceFormat: "png" | "svg";
    pngBlob: Blob | null;
  }>({
    sourceBlob: null,
    sourceFormat: "png",
    pngBlob: null
  });

  useEffect(() => {
    let cancelled = false;

    async function prepareAssets() {
      try {
        const response = await fetch(imageUrl);
        const sourceBlob = await response.blob();
        const sourceFormat = detectSourceFormat(sourceBlob, imageUrl);
        // Preparamos o PNG ANTES do clique: a copia para a area de
        // transferencia precisa acontecer imediatamente apos o clique do
        // usuario, senao o navegador bloqueia (perde o "gesto").
        const pngBlob =
          sourceFormat === "svg"
            ? await convertSvgBlobToPngHighQuality(sourceBlob, width, height)
            : sourceBlob;

        if (!cancelled) {
          setPrepared({
            sourceBlob,
            sourceFormat,
            pngBlob
          });
        }
      } catch {
        if (!cancelled) {
          setPrepared({
            sourceBlob: null,
            sourceFormat: "png",
            pngBlob: null
          });
        }
      }
    }

    void prepareAssets();

    return () => {
      cancelled = true;
    };
  }, [imageUrl, width, height]);

  async function handleCopy() {
    try {
      const sourceBlob = prepared.sourceBlob;
      const sourceFormat = prepared.sourceFormat;

      if (!sourceBlob) throw new Error("copy-asset-not-ready");

      if (sourceFormat === "svg" && !isAndroid()) {
        const copiedSvg = await tryWriteClipboardBlob(sourceBlob, "image/svg+xml");
        if (copiedSvg) {
          setMessage("Sticker SVG copiado para a area de transferencia.");
          return;
        }
      }

      const imageBlob =
        prepared.pngBlob ??
        (sourceFormat === "svg"
          ? await convertSvgBlobToPngHighQuality(sourceBlob, width, height)
          : sourceBlob);

      if (!imageBlob) throw new Error("copy-asset-not-ready");
      await writeClipboardBlob(imageBlob, "image/png");
      setMessage(
        sourceFormat === "svg"
          ? "Sticker copiado como PNG em alta resolucao."
          : "Sticker copiado como imagem."
      );
    } catch {
      setMessage("Nao foi possivel copiar no seu navegador.");
    }
  }

  const isReady = prepared.sourceBlob !== null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2">
        <Button
          type="button"
          size="lg"
          onClick={handleCopy}
          disabled={!isReady}
          className="bg-[#f2c8c8] text-[#5f3535] hover:bg-[#e8b4b4] focus-visible:ring-[#f2c8c8]"
        >
          <Copy className="mr-2 h-4 w-4" />
          {isReady ? "Copiar Sticker" : "Preparando..."}
        </Button>
      </div>
      {message ? (
        <p className="rounded-xl border border-border bg-white/70 px-3 py-2 text-xs text-muted">
          {message}
        </p>
      ) : null}
    </div>
  );
}

function detectSourceFormat(blob: Blob, imageUrl: string): "png" | "svg" {
  const byType = blob.type.toLowerCase();
  if (byType.includes("image/svg+xml")) return "svg";
  if (byType.includes("image/png")) return "png";

  const normalizedUrl = imageUrl.toLowerCase();
  if (normalizedUrl.includes(".svg")) return "svg";
  return "png";
}

async function writeClipboardBlob(blob: Blob, mime: string) {
  if (!navigator.clipboard || !window.ClipboardItem) {
    throw new Error("clipboard-not-supported");
  }

  const clipboardItemWithSupports = window.ClipboardItem as typeof ClipboardItem & {
    supports?: (type: string) => boolean;
  };

  if (clipboardItemWithSupports.supports && !clipboardItemWithSupports.supports(mime)) {
    throw new Error("clipboard-mime-not-supported");
  }

  await navigator.clipboard.write([
    new window.ClipboardItem({
      [mime]: blob
    })
  ]);
}

async function tryWriteClipboardBlob(blob: Blob, mime: string) {
  try {
    await writeClipboardBlob(blob, mime);
    return true;
  } catch {
    return false;
  }
}

async function convertSvgBlobToPngHighQuality(blob: Blob, width: number, height: number) {
  const svgText = await blob.text();
  const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await loadImage(svgUrl);
    const baseWidth = Math.max(width || image.naturalWidth || 512, 128);
    const baseHeight = Math.max(height || image.naturalHeight || 512, 128);
    const maxBase = Math.max(baseWidth, baseHeight);
    const qualityScale = Math.max(1, Math.ceil(1024 / maxBase));
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 3);

    const canvasWidth = Math.min(baseWidth * qualityScale * pixelRatio, 4096);
    const canvasHeight = Math.min(baseHeight * qualityScale * pixelRatio, 4096);

    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(canvasWidth);
    canvas.height = Math.floor(canvasHeight);

    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas-context-unavailable");

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    return await canvasToBlob(canvas, "image/png");
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image-load-failed"));
    image.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("canvas-blob-failed"));
        return;
      }
      resolve(blob);
    }, type);
  });
}

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}
