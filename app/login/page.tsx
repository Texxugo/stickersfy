import { redirect } from "next/navigation";

import { auth, signIn } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/gallery");

  const params = await searchParams;
  const authError =
    params?.error === "Configuration"
      ? "Configuração de autenticação pendente. Defina as variáveis de ambiente para envio do link mágico."
      : undefined;

  async function sendMagicLink(formData: FormData) {
    "use server";

    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    if (!email) return;

    await signIn("resend", {
      email,
      redirectTo: "/gallery"
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
            Use o mesmo e-mail da compra na Kiwify para receber seu link mágico.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LoginForm action={sendMagicLink} errorMessage={authError} />
          <p className="text-xs text-muted">
            Link válido por 30 minutos e de uso único.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
