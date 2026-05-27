import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  approveMagicLinkBridge,
  MAGIC_LINK_BRIDGE_COOKIE,
  parseMagicLinkBridgeCookie
} from "@/lib/magic-link-bridge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default async function LoginCompletePage({
  searchParams
}: {
  searchParams?: Promise<{ bridgeId?: string; approved?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  if (!session?.user?.email) {
    redirect("/login");
  }
  const sessionEmail = session.user.email.trim().toLowerCase();

  const bridgeId = params?.bridgeId?.trim();
  if (!bridgeId) {
    redirect("/gallery");
  }
  const bridgeIdValue = bridgeId;

  const cookieStore = await cookies();
  const bridgeCookie = parseMagicLinkBridgeCookie(
    cookieStore.get(MAGIC_LINK_BRIDGE_COOKIE)?.value
  );

  // Mesmo navegador que iniciou o login: aprova e segue direto.
  if (bridgeCookie?.id === bridgeIdValue) {
    await approveMagicLinkBridge(bridgeIdValue, sessionEmail);
    redirect("/gallery");
  }

  const hasApproved = params?.approved === "1";

  async function authorizeOriginalDevice() {
    "use server";

    await approveMagicLinkBridge(bridgeIdValue, sessionEmail);
    redirect(`/login/complete?bridgeId=${encodeURIComponent(bridgeIdValue)}&approved=1`);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Plataforma de stickers</p>
          <CardTitle>E-mail confirmado</CardTitle>
          <CardDescription>
            {hasApproved
              ? "Confirmacao registrada. O dispositivo onde o login foi iniciado deve entrar automaticamente em alguns segundos."
              : "Este e-mail foi aberto em outro navegador. Autorize abaixo para liberar o acesso no dispositivo onde voce iniciou o login."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasApproved ? (
            <form action={authorizeOriginalDevice}>
              <button className={buttonVariants({ size: "lg", className: "w-full" })} type="submit">
                Autorizar dispositivo original
              </button>
            </form>
          ) : null}
          <Link href="/gallery" className={buttonVariants({ size: "lg", className: "w-full" })}>
            Continuar por aqui
          </Link>
          <p className="text-xs text-muted">
            {hasApproved
              ? "Se voce iniciou o login em outro dispositivo, pode voltar para ele agora."
              : "Se preferir, voce tambem pode continuar neste navegador."}
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
