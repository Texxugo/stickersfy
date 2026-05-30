import Link from "next/link";

import { signOut } from "@/auth";
import { GalleryHamburgerMenu } from "@/components/gallery-hamburger-menu";
import { Button } from "@/components/ui/button";
import { isAdminEmail } from "@/lib/admin-emails";

type NavbarGalleryMenu = {
  categories: string[];
  currentCategory: string;
  q: string;
};

type NavbarProps = {
  email?: string | null;
  galleryMenu?: NavbarGalleryMenu;
};

export function Navbar({ email, galleryMenu }: NavbarProps) {
  const showAdminLink = Boolean(email && isAdminEmail(email));

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-bg/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-2">
          {galleryMenu ? (
            <GalleryHamburgerMenu
              categories={galleryMenu.categories}
              currentCategory={galleryMenu.currentCategory}
              q={galleryMenu.q}
              isAdmin={showAdminLink}
            />
          ) : null}
          <Link href="/gallery" className="font-title text-2xl tracking-wide">
            Sticker Hub
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {showAdminLink ? (
            <Link
              href="/admin"
              className="text-xs font-semibold uppercase tracking-wide text-muted hover:text-text"
            >
              Admin
            </Link>
          ) : null}
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
