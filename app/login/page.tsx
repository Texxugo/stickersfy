import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { auth, signIn } from "@/auth";
import { getAccessDecision } from "@/lib/access-control";
import {
  createMagicLinkBridge,
  MAGIC_LINK_BRIDGE_COOKIE,
  serializeMagicLinkBridgeCookie
} from "@/lib/magic-link-bridge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user?.email) {
    const decision = await getAccessDecision(session.user.email);
    redirect(decision.allowed ? "/gallery" : "/no-access");
  }

  const params = await searchParams;
  const authError =
    params?.error === "Configuration"
      ? "Configuracao de autenticacao pendente. Defina as variaveis de ambiente para envio do link magico."
      : params?.error === "AccessDenied"
        ? "Seu e-mail ainda nao possui acesso ativo. Finalize a compra na Kiwify para entrar."
        : undefined;

  async function sendMagicLink(formData: FormData) {
    "use server";

    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    if (!email) return;

    const bridge = await createMagicLinkBridge(email);
    (await cookies()).set({
      name: MAGIC_LINK_BRIDGE_COOKIE,
      value: serializeMagicLinkBridgeCookie(bridge.id, bridge.secret),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: bridge.expiresAt,
      path: "/"
    });

    await signIn("resend", {
      email,
      redirectTo: `/login/complete?bridgeId=${bridge.id}`
    });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">
            Plataforma de stickers
          </p>
          <CardTitle>Acesso do assinante</CardTitle>
          <CardDescription>
            Use o mesmo e-mail da compra na Kiwify para receber seu link magico.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LoginForm action={sendMagicLink} errorMessage={authError} />
          <p className="text-xs text-muted">
            Link valido por 30 minutos e de uso unico.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
