import { createHash, randomBytes } from "crypto";

import { prisma } from "@/lib/db";

export const MAGIC_LINK_BRIDGE_COOKIE = "mlb";

const BRIDGE_EXPIRY_MINUTES = 30;

type MagicBridgeStatusResult =
  | { state: "idle" }
  | { state: "pending" }
  | { state: "ready"; code: string }
  | { state: "expired" }
  | { state: "consumed" }
  | { state: "invalid" };

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function makeToken(bytes = 24) {
  return randomBytes(bytes).toString("hex");
}

export function serializeMagicLinkBridgeCookie(id: string, secret: string) {
  return `${id}.${secret}`;
}

export function parseMagicLinkBridgeCookie(value: string | undefined | null) {
  if (!value) return null;

  const [id, secret, ...rest] = value.split(".");
  if (!id || !secret || rest.length > 0) return null;

  return { id, secret };
}

export async function createMagicLinkBridge(email: string) {
  const secret = makeToken();
  const expiresAt = new Date(Date.now() + BRIDGE_EXPIRY_MINUTES * 60 * 1000);

  const bridge = await prisma.magicLinkBridge.create({
    data: {
      email,
      secretHash: sha256(secret),
      expiresAt
    }
  });

  return {
    id: bridge.id,
    secret,
    expiresAt
  };
}

export async function approveMagicLinkBridge(id: string, email: string) {
  const bridge = await prisma.magicLinkBridge.findUnique({ where: { id } });
  if (!bridge) return false;

  const now = new Date();
  if (bridge.email !== email || bridge.expiresAt <= now) {
    return false;
  }

  if (bridge.status === "CONSUMED") {
    return false;
  }

  await prisma.magicLinkBridge.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedAt: bridge.approvedAt ?? now
    }
  });

  return true;
}

export async function readMagicLinkBridgeStatus(
  cookieValue: string | undefined | null
): Promise<MagicBridgeStatusResult> {
  const parsed = parseMagicLinkBridgeCookie(cookieValue);
  if (!parsed) return { state: "idle" };

  const bridge = await prisma.magicLinkBridge.findUnique({ where: { id: parsed.id } });
  if (!bridge) return { state: "invalid" };

  if (bridge.secretHash !== sha256(parsed.secret)) {
    return { state: "invalid" };
  }

  const now = new Date();
  if (bridge.expiresAt <= now) {
    if (bridge.status !== "CONSUMED") {
      await prisma.magicLinkBridge.update({
        where: { id: bridge.id },
        data: { status: "EXPIRED" }
      });
    }

    return { state: "expired" };
  }

  if (bridge.status === "PENDING") return { state: "pending" };
  if (bridge.status === "CONSUMED") return { state: "consumed" };
  if (bridge.status === "EXPIRED") return { state: "expired" };

  if (bridge.exchangeCode) {
    return { state: "ready", code: bridge.exchangeCode };
  }

  const code = makeToken();
  const updated = await prisma.magicLinkBridge.updateMany({
    where: {
      id: bridge.id,
      status: "APPROVED",
      exchangeCode: null
    },
    data: {
      exchangeCode: code
    }
  });

  if (updated.count === 1) {
    return { state: "ready", code };
  }

  const refreshed = await prisma.magicLinkBridge.findUnique({ where: { id: bridge.id } });
  if (!refreshed?.exchangeCode) return { state: "pending" };

  return { state: "ready", code: refreshed.exchangeCode };
}

export async function consumeMagicLinkBridgeCode(code: string) {
  const bridge = await prisma.magicLinkBridge.findFirst({
    where: { exchangeCode: code }
  });

  if (!bridge) return null;

  const now = new Date();
  if (bridge.expiresAt <= now || bridge.status !== "APPROVED") {
    return null;
  }

  const updated = await prisma.magicLinkBridge.updateMany({
    where: {
      id: bridge.id,
      status: "APPROVED",
      exchangeCode: code
    },
    data: {
      status: "CONSUMED",
      consumedAt: now,
      exchangeCode: null
    }
  });

  if (updated.count !== 1) {
    return null;
  }

  return bridge.email;
}
