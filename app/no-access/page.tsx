import Link from "next/link";

import { signOut } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NoAccessPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Acesso nao liberado</CardTitle>
          <CardDescription>
            Este e-mail ainda nao possui assinatura ativa na plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted">
            Quando a compra for aprovada na Kiwify, seu acesso sera liberado automaticamente.
          </p>

          <div className="flex flex-col gap-2">
            <Link href="/login">
              <Button type="button" variant="secondary" className="w-full">
                Tentar outro e-mail
              </Button>
            </Link>

            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button type="submit" className="w-full">
                Sair
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
