import Link from "next/link";

import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

type NavbarProps = {
  email?: string | null;
};

export function Navbar({ email }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-bg/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-4 py-3">
        <Link href="/gallery" className="font-title text-2xl tracking-wide">
          Sticker Hub
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/admin" className="text-xs font-semibold uppercase tracking-wide text-muted hover:text-text">
            Admin
          </Link>
          <span className="hidden text-xs text-muted sm:inline">{email}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button type="submit" variant="secondary" size="sm">
              Sair
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
