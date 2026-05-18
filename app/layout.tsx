import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Plataforma de Stickers",
  description: "Galeria de stickers transparentes para stories e redes sociais."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="grain-overlay">{children}</body>
    </html>
  );
}
