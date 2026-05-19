import { createHash } from "node:crypto";

import { AccessStatus, BillingStatus, WebhookProcessingStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getGraceUntil } from "@/lib/access-control";

type KiwifyAction = "APPROVE" | "GRACE" | "BLOCK" | "IGNORE";

export type ParsedKiwifyPayload = {
  eventType: string;
  email: string | null;
  eventId: string | null;
  customerId: string | null;
  productId: string | null;
  subscriptionId: string | null;
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

  const action = classifyKiwifyAction(eventType, status);

  return {
    eventType,
    email: email?.trim().toLowerCase() ?? null,
    eventId,
    customerId,
    productId,
    subscriptionId,
    action
  };
}

export async function processKiwifyWebhook(payload: unknown, rawBody: string) {
  const parsed = parseKiwifyPayload(payload);
  const dedupeKey = buildDedupeKey(parsed.eventId, rawBody);

  const existing = await prisma.kiwifyWebhookDelivery.findUnique({
    where: { dedupeKey },
    select: { id: true }
  });

  if (existing) {
    return {
      duplicated: true,
      parsed
    };
  }

  try {
    await applyKiwifyAction(parsed);

    await prisma.kiwifyWebhookDelivery.create({
      data: {
        dedupeKey,
        eventType: parsed.eventType,
        email: parsed.email,
        payload: payload as object,
        processingStatus: WebhookProcessingStatus.PROCESSED,
        processedAt: new Date()
      }
    });

    return {
      duplicated: false,
      parsed
    };
  } catch (error) {
    await prisma.kiwifyWebhookDelivery.create({
      data: {
        dedupeKey,
        eventType: parsed.eventType,
        email: parsed.email,
        payload: payload as object,
        processingStatus: WebhookProcessingStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : "Erro desconhecido",
        processedAt: new Date()
      }
    });
    throw error;
  }
}

function buildDedupeKey(eventId: string | null, rawBody: string) {
  if (eventId) return `event:${eventId}`;
  return `hash:${createHash("sha256").update(rawBody).digest("hex")}`;
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

async function applyKiwifyAction(parsed: ParsedKiwifyPayload) {
  if (!parsed.email) return;

  if (parsed.action === "IGNORE") {
    return;
  }

  const now = new Date();

  if (parsed.action === "APPROVE") {
    await prisma.customerAccess.upsert({
      where: { email: parsed.email },
      update: {
        accessStatus: AccessStatus.ACTIVE,
        billingStatus: BillingStatus.APPROVED,
        graceUntil: null,
        kiwifyCustomerId: parsed.customerId ?? undefined,
        kiwifyProductId: parsed.productId ?? undefined,
        kiwifySubscriptionId: parsed.subscriptionId ?? undefined,
        lastEventType: parsed.eventType,
        lastEventAt: now,
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
        lastEventAt: now,
        lastApprovedAt: now
      }
    });
    return;
  }

  if (parsed.action === "GRACE") {
    const graceUntil = getGraceUntil(now, 7);
    await prisma.customerAccess.upsert({
      where: { email: parsed.email },
      update: {
        accessStatus: AccessStatus.GRACE,
        billingStatus: BillingStatus.PAYMENT_FAILED,
        graceUntil,
        lastEventType: parsed.eventType,
        lastEventAt: now,
        lastPaymentFailedAt: now
      },
      create: {
        email: parsed.email,
        accessStatus: AccessStatus.GRACE,
        billingStatus: BillingStatus.PAYMENT_FAILED,
        graceUntil,
        lastEventType: parsed.eventType,
        lastEventAt: now,
        lastPaymentFailedAt: now
      }
    });
    return;
  }

  await prisma.customerAccess.upsert({
    where: { email: parsed.email },
    update: {
      accessStatus: AccessStatus.BLOCKED,
      billingStatus: mapBlockBillingStatus(parsed.eventType),
      graceUntil: null,
      lastEventType: parsed.eventType,
      lastEventAt: now,
      lastBlockedAt: now
    },
    create: {
      email: parsed.email,
      accessStatus: AccessStatus.BLOCKED,
      billingStatus: mapBlockBillingStatus(parsed.eventType),
      graceUntil: null,
      lastEventType: parsed.eventType,
      lastEventAt: now,
      lastBlockedAt: now
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
