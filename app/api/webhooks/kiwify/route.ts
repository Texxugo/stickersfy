import { NextRequest, NextResponse } from "next/server";

import { processKiwifyWebhook } from "@/lib/kiwify-webhook";

export async function POST(request: NextRequest) {
  if (!isAuthorizedWebhookRequest(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized webhook request"
      },
      { status: 401 }
    );
  }

  const rawBody = await request.text();
  let payload: unknown;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid JSON payload"
      },
      { status: 400 }
    );
  }

  try {
    const result = await processKiwifyWebhook(payload, rawBody);

    return NextResponse.json({
      ok: true,
      duplicated: result.duplicated,
      eventType: result.parsed.eventType,
      action: result.parsed.action,
      email: result.parsed.email,
      ignoredReason: result.ignoredReason ?? undefined
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unhandled webhook error"
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const tokenConfigured = Boolean(process.env.KIWIFY_WEBHOOK_TOKEN?.trim());
  const simulationConfigured = Boolean(process.env.KIWIFY_SIMULATION_KEY?.trim());
  const allowedProductIds =
    process.env.KIWIFY_ALLOWED_PRODUCT_IDS
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean) ?? [];

  return NextResponse.json({
    ok: true,
    service: "kiwify-webhook",
    timestamp: new Date().toISOString(),
    config: {
      tokenConfigured,
      simulationConfigured,
      allowedProductIdsCount: allowedProductIds.length
    }
  });
}

function isAuthorizedWebhookRequest(request: NextRequest) {
  const token = process.env.KIWIFY_WEBHOOK_TOKEN?.trim();

  if (!token) {
    return process.env.NODE_ENV !== "production";
  }

  const queryToken = request.nextUrl.searchParams.get("token")?.trim();
  if (queryToken && queryToken === token) return true;

  const headerToken = request.headers.get("x-kiwify-webhook-token")?.trim();
  if (headerToken && headerToken === token) return true;

  return false;
}
