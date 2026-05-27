import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { getAccessDecision } from "@/lib/access-control";
import { prisma } from "@/lib/db";
import { consumeMagicLinkBridgeCode } from "@/lib/magic-link-bridge";

const provider = Resend({
  apiKey: process.env.RESEND_API_KEY,
  from: process.env.RESEND_FROM ?? "noreply@stickers.local"
});

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
    strategy: "database"
  },
  callbacks: {
    async signIn(params) {
      const candidateEmail =
        params.user?.email?.trim().toLowerCase() ??
        (params as { email?: { email?: string } }).email?.email?.trim().toLowerCase() ??
        null;

      if (!candidateEmail) return false;

      const decision = await getAccessDecision(candidateEmail);
      return decision.allowed;
    }
  },
  trustHost: true
});
