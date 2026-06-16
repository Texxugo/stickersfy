import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isPanelBypassEnabled } from "@/lib/panel-bypass";
import { getClientIp, rateLimit, retryAfterSeconds } from "@/lib/rate-limit";

const MAX_NAME_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 500;

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const limited = rateLimit(`suggest:${ip}`, 10, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Muitas sugestoes em pouco tempo. Tente novamente em instantes." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds(limited.resetAt)) } }
    );
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Banco de dados nao configurado." },
      { status: 503 }
    );
  }

  const session = await auth();
  const userEmail = session?.user?.email ?? null;
  if (!userEmail && !isPanelBypassEnabled()) {
    return NextResponse.json({ error: "Login necessario." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = sanitizeText(body?.name, MAX_NAME_LENGTH);
  const message = sanitizeText(body?.message, MAX_MESSAGE_LENGTH);

  if (!name || !message) {
    return NextResponse.json(
      { error: "Informe seu nome e a sugestao." },
      { status: 400 }
    );
  }

  try {
    await prisma.phraseSuggestion.create({
      data: {
        name,
        message,
        userEmail
      }
    });
  } catch {
    return NextResponse.json(
      { error: "Sugestoes ainda nao estao habilitadas no banco." },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true });
}

function sanitizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";

  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}
