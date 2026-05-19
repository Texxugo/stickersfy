import { AccessStatus, type CustomerAccess } from "@prisma/client";

import { isAdminEmail } from "@/lib/admin-emails";
import { prisma } from "@/lib/db";

const DEFAULT_GRACE_DAYS = 7;

export type AccessDecision = {
  allowed: boolean;
  reason:
    | "admin"
    | "active"
    | "grace"
    | "grace-expired"
    | "blocked"
    | "not-found";
  record: CustomerAccess | null;
};

export async function getAccessDecision(email: string): Promise<AccessDecision> {
  const normalizedEmail = email.trim().toLowerCase();
  if (isAdminEmail(normalizedEmail)) {
    return {
      allowed: true,
      reason: "admin",
      record: null
    };
  }

  let record: CustomerAccess | null = null;
  try {
    record = await prisma.customerAccess.findUnique({
      where: { email: normalizedEmail }
    });
  } catch {
    return {
      allowed: false,
      reason: "not-found",
      record: null
    };
  }

  if (!record) {
    return {
      allowed: false,
      reason: "not-found",
      record: null
    };
  }

  if (record.accessStatus === AccessStatus.ACTIVE) {
    return {
      allowed: true,
      reason: "active",
      record
    };
  }

  if (record.accessStatus === AccessStatus.GRACE) {
    if (record.graceUntil && record.graceUntil >= new Date()) {
      return {
        allowed: true,
        reason: "grace",
        record
      };
    }

    return {
      allowed: false,
      reason: "grace-expired",
      record
    };
  }

  return {
    allowed: false,
    reason: "blocked",
    record
  };
}

export function getGraceUntil(baseDate = new Date(), days = DEFAULT_GRACE_DAYS) {
  return new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
}
