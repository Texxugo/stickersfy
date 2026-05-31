import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { getAccessDecision } from "@/lib/access-control";
import { prisma } from "@/lib/db";
import { consumeMagicLinkBridgeCode } from "@/lib/magic-link-bridge";

const provider = Resend({
  apiKey: process.env.RESEND_API_KEY,
  from: process.env.RESEND_FROM ?? "noreply@stickers.local",
  async sendVerificationRequest({ identifier: to, url, provider }) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: provider.from,
        to,
        subject: "Seu acesso à plataforma Stickersfy",
        html: buildVerificationEmailHtml(url),
        text: buildVerificationEmailText(url)
      })
    });

    if (!res.ok) {
      throw new Error("Resend error: " + JSON.stringify(await res.json()));
    }
  }
});

function buildVerificationEmailHtml(url: string) {
  const detailImageUrl =
    "https://res.cloudinary.com/daqviwwrv/image/upload/v1780195853/ChatGPT_Image_30_de_mai._de_2026__23_49_26-removebg-preview_nacqz8.png";

  return `
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Seu acesso à plataforma Stickersfy</title>
  </head>
  <body style="margin:0;background:#f6f3ee;font-family:Arial,Helvetica,sans-serif;color:#27221f;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f3ee;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #ece5dc;">
            <tr>
              <td align="center" style="padding:32px 32px 12px;">
                <img src="${detailImageUrl}" width="120" alt="Stickersfy" style="display:block;width:120px;max-width:120px;height:auto;border:0;margin:0 auto 18px;">
                <h1 style="margin:0;font-size:24px;line-height:1.25;color:#1f1a17;">Olá!</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px;font-size:16px;line-height:1.65;color:#4a423c;">
                <p style="margin:0 0 16px;">Obrigado por adquirir o acesso à nossa plataforma de stickers. Ficamos muito felizes em ter você com a gente.</p>
                <p style="margin:0 0 24px;">Para acessar sua conta e começar a usar a plataforma, clique no botão abaixo:</p>
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 24px;">
                  <tr>
                    <td align="center" bgcolor="#f05a28" style="border-radius:10px;">
                      <a href="${url}" style="display:inline-block;padding:14px 24px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">Acessar plataforma</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 16px;">Caso você não tenha solicitado este acesso, basta ignorar este e-mail.</p>
                <p style="margin:0;">Atenciosamente,<br>Equipe Stickersfy</p>
              </td>
            </tr>
            <tr>
              <td style="background:#fbfaf8;border-top:1px solid #ece5dc;padding:22px 32px;font-size:14px;line-height:1.6;color:#6d625b;">
                <p style="margin:0 0 8px;font-weight:700;color:#3a332e;">Precisa de ajuda?</p>
                <p style="margin:0;">E-mail: <a href="mailto:stickersfy.suporte@gmail.com" style="color:#f05a28;text-decoration:none;">stickersfy.suporte@gmail.com</a></p>
                <p style="margin:0;">Telefone/WhatsApp: <a href="https://wa.me/5519993253891" style="color:#f05a28;text-decoration:none;">(19) 99325-3891</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildVerificationEmailText(url: string) {
  return `Olá!

Obrigado por adquirir o acesso à nossa plataforma de stickers. Ficamos muito felizes em ter você com a gente.

Para acessar sua conta e começar a usar a plataforma, acesse o link abaixo:

${url}

Caso você não tenha solicitado este acesso, basta ignorar este e-mail.

Se tiver qualquer problema para acessar, fale com nosso suporte:

E-mail: stickersfy.suporte@gmail.com
Telefone/WhatsApp: (19) 99325-3891

Atenciosamente,
Equipe Stickersfy`;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    provider,
    Credentials({
      id: "magic-bridge",
      name: "Magic Bridge",
      credentials: {
        code: { label: "Code", type: "text" }
      },
      async authorize(credentials) {
        const code = String(credentials?.code ?? "").trim();
        if (!code) return null;

        const email = await consumeMagicLinkBridgeCode(code);
        if (!email) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, name: true, image: true }
        });

        return user;
      }
    })
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify-request"
  },
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id ?? token.sub;
        token.email = user.email ?? token.email;
        token.name = user.name ?? token.name;
        token.picture = user.image ?? token.picture;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email ?? session.user.email;
        session.user.name = token.name ?? session.user.name;
        session.user.image = token.picture ?? session.user.image;
      }

      return session;
    },
    async signIn(params) {
      const providerId = params.account?.provider;
      const candidateEmail =
        params.user?.email?.trim().toLowerCase() ??
        (params as { email?: { email?: string } }).email?.email?.trim().toLowerCase() ??
        null;

      if (!candidateEmail) {
        if (providerId === "magic-bridge" && params.user?.id) {
          const existing = await prisma.user.findUnique({
            where: { id: params.user.id },
            select: { email: true }
          });

          if (existing?.email) {
            const decision = await getAccessDecision(existing.email.trim().toLowerCase());
            return decision.allowed;
          }
        }

        return false;
      }

      const decision = await getAccessDecision(candidateEmail);
      return decision.allowed;
    }
  },
  trustHost: true
});
