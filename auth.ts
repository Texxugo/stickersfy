import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { getAccessDecision } from "@/lib/access-control";
import { prisma } from "@/lib/db";

const provider = Resend({
  apiKey: process.env.RESEND_API_KEY,
  from: process.env.RESEND_FROM ?? "noreply@stickers.local"
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [provider],
  pages: {
    signIn: "/login"
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
