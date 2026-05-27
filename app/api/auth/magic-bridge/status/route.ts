import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  MAGIC_LINK_BRIDGE_COOKIE,
  readMagicLinkBridgeStatus
} from "@/lib/magic-link-bridge";

export async function GET() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(MAGIC_LINK_BRIDGE_COOKIE)?.value;

  const status = await readMagicLinkBridgeStatus(cookieValue);
  const response = NextResponse.json(status);
  response.headers.set("Cache-Control", "no-store");

  if (
    status.state === "idle" ||
    status.state === "invalid" ||
    status.state === "expired" ||
    status.state === "consumed"
  ) {
    response.cookies.set({
      name: MAGIC_LINK_BRIDGE_COOKIE,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: new Date(0),
      path: "/"
    });
  }

  return response;
}
