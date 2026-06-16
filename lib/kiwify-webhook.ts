import { createHash } from "node:crypto";

import { AccessStatus, BillingStatus, WebhookProcessingStatus, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getGraceUntil } from "@/lib/access-control";

type KiwifyAction = "APPROVE" | "GRACE" | "BLOCK" | "IGNORE";

type TxClient = Prisma.TransactionClient;

export type ParsedKiwifyPayload = {
  eventType: string;
  email: string | null;
  eventId: string | null;
  customerId: string | null;
  productId: string | null;
  subscriptionId: string | null;
  eventAt: Date | null;
  action: KiwifyAction;
};

export function parseKiwifyPayload(payload: unknown): ParsedKiwifyPayload {
  const eventType =
    getStringByPaths(payload, [
      "event",
      "event_type",
      "type",
      "name",
      "data.event",
      "data.type"
    ]) ?? "unknown";

  const status = getStringByPaths(payload, [
    "status",
    "order_status",
    "payment_status",
    "subscription_status",
    "data.status",
    "data.order_status"
  ]);

  const email =
    getStringByPaths(payload, [
      "email",
      "customer.email",
      "buyer.email",
      "client.email",
      "lead.email",
      "data.email",
      "data.customer.email",
      "order.customer.email"
    ]) ?? findFirstEmail(payload);

  const eventId = getStringByPaths(payload, [
    "event_id",
    "id",
    "webhook_id",
    "webhook_event_id",
    "data.event_id",
    "data.id"
  ]);

  const customerId = getStringByPaths(payload, [
    "customer.id",
    "buyer.id",
    "data.customer.id"
  ]);

  const productId = getStringByPaths(payload, [
    "product.id",
    "product_id",
    "data.product.id",
    "offer.id"
  ]);

  const subscriptionId = getStringByPaths(payload, [
    "subscription.id",
    "subscription_id",
    "data.subscription.id",
    "plan.subscription_id"
  ]);

  const eventAt = getDateByPaths(payload, [
    "created_at",
    "updated_at",
    "event_date",
    "webhook_event_date",
    "data.created_at",
    "data.updated_at",
    "order.created_at",
    "order.updated_at"
  ]);

  const action = classifyKiwifyAction(eventType, status);

  return {
    eventType,
    email: email?.trim().toLowerCase() ?? null,
    eventId,
    customerId,
    productId,
    subscriptionId,
    eventAt,
    action
  };
}

export async function processKiwifyWebhook(payload: unknown, rawBody: string) {
  const parsed = parseKiwifyPayload(payload);
  const dedupeKey = buildDedupeKey(parsed.eventId, rawBody);
  const ignoredReason = getIgnoredReason(parsed);

  const existing = await prisma.kiwifyWebhookDelivery.findUnique({
    where: { dedupeKey },
    select: { id: true }
  });

  if (existing) {
    return {
      duplicated: true,
      parsed,
      ignoredReason: null
    };
  }

  if (ignoredReason) {
    await prisma.kiwifyWebhookDelivery.create({
      data: {
        dedupeKey,
        eventType: parsed.eventType,
        email: parsed.email,
        payload: payload as object,
        processingStatus: WebhookProcessingStatus.IGNORED,
        errorMessage: ignoredReason,
        processedAt: new Date()
      }
    });

    return {
      duplicated: false,
      parsed,
      ignoredReason
    };
  }

  try {
    // Aplica a acao e grava o registro PROCESSED na MESMA transacao:
    // se algo falhar, tudo e revertido e o dedupeKey permanece livre
    // para um reenvio legitimo da Kiwify reprocessar.
    await prisma.$transaction(async (tx) => {
      await applyKiwifyAction(parsed, tx);

      await tx.kiwifyWebhookDelivery.create({
        data: {
          dedupeKey,
          eventType: parsed.eventType,
          email: parsed.email,
          payload: payload as object,
          processingStatus: WebhookProcessingStatus.PROCESSED,
          processedAt: new Date()
        }
      });
    });

    return {
      duplicated: false,
      parsed,
      ignoredReason: null
    };
  } catch (error) {
    // Registra a falha com uma chave unica derivada, sem ocupar o dedupeKey
    // real (assim o reenvio nao e tratado como duplicado e pode reprocessar).
    await prisma.kiwifyWebhookDelivery
      .create({
        data: {
          dedupeKey: `${dedupeKey}:failed:${Date.now()}`,
          eventType: parsed.eventType,
          email: parsed.email,
          payload: payload as object,
          processingStatus: WebhookProcessingStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : "Erro desconhecido",
          processedAt: new Date()
        }
      })
      .catch(() => undefined);
    throw error;
  }
}

function buildDedupeKey(eventId: string | null, rawBody: string) {
  if (eventId) return `event:${eventId}`;
  return `hash:${createHash("sha256").update(rawBody).digest("hex")}`;
}

function getIgnoredReason(parsed: ParsedKiwifyPayload) {
  if (!parsed.email) {
    return "Payload sem email de comprador";
  }

  if (parsed.action === "IGNORE") {
    return "Evento nao mapeado para controle de acesso";
  }

  const allowedProductIds = getAllowedProductIds();
  if (!allowedProductIds) return null;

  if (!parsed.productId) {
    return "Evento ignorado: productId ausente e allowlist ativa";
  }

  if (!allowedProductIds.has(parsed.productId)) {
    return `Evento ignorado: productId ${parsed.productId} fora da allowlist`;
  }

  return null;
}

function getAllowedProductIds() {
  const raw = process.env.KIWIFY_ALLOWED_PRODUCT_IDS?.trim();
  if (!raw) return null;

  const ids = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (ids.length === 0) return null;
  return new Set(ids);
}

function classifyKiwifyAction(eventType: string, status: string | null): KiwifyAction {
  const source = `${eventType} ${status ?? ""}`.toLowerCase();

  if (matchesAny(source, ["chargeback", "estorno", "refund", "refunded"])) {
    return "BLOCK";
  }

  if (matchesAny(source, ["approved", "paid", "aprovad", "pago"])) {
    return "APPROVE";
  }

  if (
    matchesAny(source, [
      "payment_failed",
      "failed",
      "declined",
      "inadimpl",
      "past_due",
      "overdue",
      "cancel",
      "canceled",
      "cancelled"
    ])
  ) {
    return "GRACE";
  }

  return "IGNORE";
}

async function applyKiwifyAction(parsed: ParsedKiwifyPayload, tx: TxClient) {
  if (!parsed.email || parsed.action === "IGNORE") return;

  const now = new Date();
  // Momento do evento na origem (Kiwify). Usado para ordenar eventos que
  // chegam fora de ordem; cai para `now` se o payload nao trouxer data.
  const eventAt = parsed.eventAt ?? now;

  const existing = await tx.customerAccess.findUnique({
    where: { email: parsed.email },
    select: { lastEventAt: true }
  });

  // Guarda de ordenacao: ignora eventos mais antigos que o ultimo aplicado
  // para nao reverter o estado (ex.: um "approved" atrasado sobrescrevendo
  // um "refund" mais recente).
  if (existing?.lastEventAt && eventAt < existing.lastEventAt) {
    return;
  }

  if (parsed.action === "APPROVE") {
    await ensureUserProvisioned(parsed.email, tx);

    await tx.customerAccess.upsert({
      where: { email: parsed.email },
      update: {
        accessStatus: AccessStatus.ACTIVE,
        billingStatus: BillingStatus.APPROVED,
        graceUntil: null,
        kiwifyCustomerId: parsed.customerId ?? undefined,
        kiwifyProductId: parsed.productId ?? undefined,
        kiwifySubscriptionId: parsed.subscriptionId ?? undefined,
        lastEventType: parsed.eventType,
        lastEventAt: eventAt,
        lastApprovedAt: now
      },
      create: {
        email: parsed.email,
        accessStatus: AccessStatus.ACTIVE,
        billingStatus: BillingStatus.APPROVED,
        graceUntil: null,
        kiwifyCustomerId: parsed.customerId ?? undefined,
        kiwifyProductId: parsed.productId ?? undefined,
        kiwifySubscriptionId: parsed.subscriptionId ?? undefined,
        lastEventType: parsed.eventType,
        lastEventAt: eventAt,
        lastApprovedAt: now
      }
    });
    return;
  }

  if (parsed.action === "GRACE") {
    const graceUntil = getGraceUntil(now, 7);
    await tx.customerAccess.upsert({
      where: { email: parsed.email },
      update: {
        accessStatus: AccessStatus.GRACE,
        billingStatus: BillingStatus.PAYMENT_FAILED,
        graceUntil,
        lastEventType: parsed.eventType,
        lastEventAt: eventAt,
        lastPaymentFailedAt: now
      },
      create: {
        email: parsed.email,
        accessStatus: AccessStatus.GRACE,
        billingStatus: BillingStatus.PAYMENT_FAILED,
        graceUntil,
        lastEventType: parsed.eventType,
        lastEventAt: eventAt,
        lastPaymentFailedAt: now
      }
    });
    return;
  }

  await tx.customerAccess.upsert({
    where: { email: parsed.email },
    update: {
      accessStatus: AccessStatus.BLOCKED,
      billingStatus: mapBlockBillingStatus(parsed.eventType),
      graceUntil: null,
      lastEventType: parsed.eventType,
      lastEventAt: eventAt,
      lastBlockedAt: now
    },
    create: {
      email: parsed.email,
      accessStatus: AccessStatus.BLOCKED,
      billingStatus: mapBlockBillingStatus(parsed.eventType),
      graceUntil: null,
      lastEventType: parsed.eventType,
      lastEventAt: eventAt,
      lastBlockedAt: now
    }
  });
}

async function ensureUserProvisioned(email: string, tx: TxClient) {
  await tx.user.upsert({
    where: { email },
    update: {
      email
    },
    create: {
      email
    }
  });
}

function mapBlockBillingStatus(eventType: string) {
  const normalized = eventType.toLowerCase();
  if (normalized.includes("chargeback")) return BillingStatus.CHARGEBACK;
  return BillingStatus.REFUNDED;
}

function matchesAny(source: string, terms: string[]) {
  return terms.some((term) => source.includes(term));
}

function getStringByPaths(payload: unknown, paths: string[]) {
  for (const path of paths) {
    const value = getValueByPath(payload, path);
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

function getDateByPaths(payload: unknown, paths: string[]): Date | null {
  for (const path of paths) {
    const value = getValueByPath(payload, path);
    if (typeof value === "string" || typeof value === "number") {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) return date;
    }
  }
  return null;
}

function getValueByPath(payload: unknown, path: string) {
  const parts = path.split(".");
  let cursor: unknown = payload;

  for (const part of parts) {
    if (!cursor || typeof cursor !== "object" || Array.isArray(cursor)) return null;
    cursor = (cursor as Record<string, unknown>)[part];
  }

  return cursor;
}

function findFirstEmail(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const found = findFirstEmail(item);
      if (found) return found;
    }
    return null;
  }

  for (const [key, value] of Object.entries(payload)) {
    if (key.toLowerCase() === "email" && typeof value === "string" && value.includes("@")) {
      return value;
    }

    if (value && typeof value === "object") {
      const found = findFirstEmail(value);
      if (found) return found;
    }
  }

  return null;
}
