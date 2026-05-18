"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Download, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type StickerActionsProps = {
  title: string;
  imageUrl: string;
  width: number;
  height: number;
};

const FALLBACK_TEXT =
  "Sticker baixado. No Instagram, toque em adicionar imagem e selecione o PNG.";

export function StickerActions({ title, imageUrl, width, height }: StickerActionsProps) {
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
  const appleMobile = useMemo(() => isAppleMobile(), []);

  useEffect(() => {
    let cancelled = false;

    async function prepareAssets() {
      try {
        const response = await fetch(imageUrl);
        const sourceBlob = await response.blob();
        const sourceFormat = detectSourceFormat(sourceBlob, imageUrl);
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

  async function handleShare() {
    const popup = appleMobile ? window.open("", "_blank") : null;

    try {
      const shareBlob = prepared.pngBlob;
      if (!shareBlob) throw new Error("share-asset-not-ready");

      const filename = buildFilename(title, "png");

      const shared = await tryNativeShare(shareBlob, filename, title);
      if (shared) {
        if (popup) popup.close();
        setMessage(
          appleMobile
            ? "Menu de compartilhamento aberto. Se quiser na galeria, toque em Salvar Imagem."
            : "Menu de compartilhamento aberto."
        );
        return;
      }
    } catch {
      if (popup) {
        openBlobInExistingPopup(popup, prepared.pngBlob ?? prepared.sourceBlob);
        setMessage(
          "Compartilhamento indisponível neste iPhone. A imagem abriu em nova aba: mantenha pressionado e toque em Salvar em Fotos."
        );
        return;
      }
      setMessage("Não foi possível compartilhar este sticker no momento.");
      return;
    }

    if (popup) {
      openBlobInExistingPopup(popup, prepared.pngBlob ?? prepared.sourceBlob);
      setMessage(
        "Compartilhamento indisponível neste iPhone. A imagem abriu em nova aba: mantenha pressionado e toque em Salvar em Fotos."
      );
      return;
    }

    setMessage("Compartilhamento não disponível neste navegador.");
  }

  async function handleCopy() {
    try {
      const sourceBlob = prepared.sourceBlob;
      const sourceFormat = prepared.sourceFormat;

      if (!sourceBlob) throw new Error("copy-asset-not-ready");

      if (sourceFormat === "svg") {
        const copiedSvg = await tryWriteClipboardBlob(sourceBlob, "image/svg+xml");
        if (copiedSvg) {
          setMessage("Sticker SVG copiado para a área de transferência.");
          return;
        }

        const pngBlob =
          prepared.pngBlob ??
          (await convertSvgBlobToPngHighQuality(sourceBlob, width, height));
        await writeClipboardBlob(pngBlob, "image/png");
        setMessage("Sticker SVG convertido para PNG em alta qualidade e copiado.");
        return;
      }

      await writeClipboardBlob(sourceBlob, sourceBlob.type || "image/png");
      setMessage("Sticker copiado como imagem.");
    } catch {
      setMessage("Não foi possível copiar no seu navegador. Use Compartilhar ou Baixar.");
    }
  }

  async function handleDownload(isFallback = false) {
    try {
      const sourceBlob = prepared.sourceBlob;
      const sourceFormat = prepared.sourceFormat;

      if (!sourceBlob) throw new Error("download-asset-not-ready");

      if (isFallback) {
        const fallbackBlob = prepared.pngBlob ?? sourceBlob;

        const opened =
          appleMobile &&
          (sourceFormat === "png"
            ? openPreviewImageRouteInNewTab(imageUrl)
            : openBlobInNewTab(fallbackBlob));
        if (opened) {
          setMessage(
            "No iPhone, na nova aba, pressione a imagem e toque em Salvar em Fotos."
          );
          return;
        }

        downloadBlob(fallbackBlob, buildFilename(title, "png"));
        setMessage(FALLBACK_TEXT);
        return;
      }

      if (sourceFormat === "svg") {
        downloadBlob(sourceBlob, buildFilename(title, "svg"));
        setMessage("SVG original baixado sem conversão de qualidade.");
        return;
      }

      if (appleMobile) {
        const opened =
          sourceFormat === "png"
            ? openPreviewImageRouteInNewTab(imageUrl)
            : openBlobInNewTab(sourceBlob);
        if (opened) {
          setMessage(
            "No iPhone, na nova aba, pressione a imagem e toque em Salvar em Fotos."
          );
          return;
        }
      }

      downloadBlob(sourceBlob, buildFilename(title, "png"));
      setMessage("Sticker baixado com sucesso.");
    } catch {
      setMessage("Não foi possível baixar este sticker no momento.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button type="button" variant="primary" size="lg" onClick={handleShare}>
          <Share2 className="mr-2 h-4 w-4" />
          Compartilhar Sticker
        </Button>
        <Button type="button" size="lg" onClick={handleCopy}>
          <Copy className="mr-2 h-4 w-4" />
          Copiar Sticker
        </Button>
        <Button type="button" variant="secondary" size="lg" onClick={() => handleDownload()}>
          <Download className="mr-2 h-4 w-4" />
          {appleMobile ? "Salvar Arquivo" : "Baixar Arquivo"}
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

function buildFilename(title: string, extension: "png" | "svg") {
  const safeTitle = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return `${safeTitle || "sticker"}.${extension}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

function openBlobInNewTab(blob: Blob) {
  const objectUrl = URL.createObjectURL(blob);
  const opened = window.open(objectUrl, "_blank");
  if (!opened) {
    URL.revokeObjectURL(objectUrl);
    return false;
  }
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  return true;
}

function openBlobInExistingPopup(targetWindow: Window, blob: Blob | null) {
  if (!blob) {
    targetWindow.close();
    return;
  }

  const objectUrl = URL.createObjectURL(blob);
  targetWindow.location.href = objectUrl;

  setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
}

function openPreviewImageRouteInNewTab(sourceUrl: string) {
  const previewUrl = `/api/preview-image?src=${encodeURIComponent(sourceUrl)}`;
  const opened = window.open(previewUrl, "_blank");
  return Boolean(opened);
}

async function writeClipboardBlob(blob: Blob, mime: string) {
  if (!navigator.clipboard || !window.ClipboardItem) {
    throw new Error("clipboard-not-supported");
  }

  await navigator.clipboard.write([
    new window.ClipboardItem({
      [mime]: blob
    })
  ]);
}

async function tryNativeShare(blob: Blob, filename: string, title: string) {
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
  };

  if (typeof nav.share !== "function") return false;

  const file = new File([blob], filename, { type: blob.type || "image/png" });
  const shareData: ShareData = { files: [file], title };

  if (nav.canShare && !nav.canShare(shareData)) return false;

  try {
    await nav.share(shareData);
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return false;
    }
    return false;
  }
}

async function tryWriteClipboardBlob(blob: Blob, mime: string) {
  if (!navigator.clipboard || !window.ClipboardItem) return false;

  const clipboardItemWithSupports = window.ClipboardItem as typeof ClipboardItem & {
    supports?: (type: string) => boolean;
  };

  if (clipboardItemWithSupports.supports && !clipboardItemWithSupports.supports(mime)) {
    return false;
  }

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

function isAppleMobile() {
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isTouchMac = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
  return isIOS || isTouchMac;
}
