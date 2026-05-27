import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { MagicLinkWaiting } from "@/components/magic-link-waiting";

export default function VerifyRequestPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Plataforma de stickers</p>
          <CardTitle>Confira seu e-mail</CardTitle>
          <CardDescription>
            Enviamos um link magico. Se preferir, voce pode abrir o e-mail em outro navegador ou dispositivo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <MagicLinkWaiting />
          <Link href="/login" className={buttonVariants({ variant: "secondary", size: "lg", className: "w-full" })}>
            Solicitar novo link
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
