import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  approveMagicLinkBridge,
  approveMagicLinkBridgesForEmail
} from "@/lib/magic-link-bridge";

export default async function LoginCompletePage({
  searchParams
}: {
  searchParams?: Promise<{ bridgeId?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const sessionEmail = session.user.email.trim().toLowerCase();
  const params = await searchParams;
  const bridgeId = params?.bridgeId?.trim();

  // Clique no e-mail aprova o acesso de forma global para a conta.
  await approveMagicLinkBridgesForEmail(sessionEmail);

  // Mantem compatibilidade com o bridge especifico no link.
  if (bridgeId) {
    await approveMagicLinkBridge(bridgeId, sessionEmail);
  }

  redirect("/gallery");
}
