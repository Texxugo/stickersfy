import { promises as fs } from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_CONTENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml"
]);

export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get("src");
  if (!src) {
    return new NextResponse("Missing src", { status: 400 });
  }

  try {
    if (src.startsWith("/")) {
      return await serveLocalPublicAsset(src);
    }

    const url = new URL(src);
    if (!["http:", "https:"].includes(url.protocol)) {
      return new NextResponse("Invalid protocol", { status: 400 });
    }

    // MVP hardening: only proxy Cloudinary remote assets.
    if (url.hostname !== "res.cloudinary.com") {
      return new NextResponse("Host not allowed", { status: 403 });
    }

    const upstream = await fetch(url.toString(), {
      cache: "no-store"
    });

    if (!upstream.ok) {
      return new NextResponse("Failed to fetch source image", { status: 502 });
    }

    const contentType = upstream.headers.get("content-type")?.split(";")[0] ?? "";
    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      return new NextResponse("Unsupported content type", { status: 415 });
    }

    const arrayBuffer = await upstream.arrayBuffer();
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "Cache-Control": "no-store"
      }
    });
  } catch {
    return new NextResponse("Invalid source image", { status: 400 });
  }
}

async function serveLocalPublicAsset(src: string) {
  const normalized = src.replace(/\\/g, "/");
  if (!normalized.startsWith("/stickers/")) {
    return new NextResponse("Path not allowed", { status: 403 });
  }

  const filePath = path.join(process.cwd(), "public", normalized);
  const resolved = path.resolve(filePath);
  const allowedRoot = path.resolve(path.join(process.cwd(), "public", "stickers"));
  if (!resolved.startsWith(allowedRoot)) {
    return new NextResponse("Path traversal not allowed", { status: 403 });
  }

  const data = await fs.readFile(resolved);
  const extension = path.extname(resolved).toLowerCase();
  const contentType =
    extension === ".svg"
      ? "image/svg+xml"
      : extension === ".png"
        ? "image/png"
        : extension === ".jpg" || extension === ".jpeg"
          ? "image/jpeg"
          : extension === ".webp"
            ? "image/webp"
            : extension === ".gif"
              ? "image/gif"
              : "";

  if (!contentType || !ALLOWED_CONTENT_TYPES.has(contentType)) {
    return new NextResponse("Unsupported content type", { status: 415 });
  }

  return new NextResponse(data, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": "inline",
      "Cache-Control": "no-store"
    }
  });
}
