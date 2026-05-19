import { NextRequest, NextResponse } from "next/server";

import { processKiwifyWebhook } from "@/lib/kiwify-webhook";

export async function POST(request: NextRequest) {
  const simulationKey = process.env.KIWIFY_SIMULATION_KEY?.trim();
  const providedKey = request.nextUrl.searchParams.get("key")?.trim();

  if (!simulationKey || providedKey !== simulationKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized simulation request"
      },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid simulation payload"
      },
      { status: 400 }
    );
  }

  const rawBody = JSON.stringify(body);

  try {
    const result = await processKiwifyWebhook(body, rawBody);
    return NextResponse.json({
      ok: true,
      simulation: true,
      duplicated: result.duplicated,
      eventType: result.parsed.eventType,
      action: result.parsed.action,
      email: result.parsed.email
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        simulation: true,
        error: error instanceof Error ? error.message : "Simulation failed"
      },
      { status: 500 }
    );
  }
}
