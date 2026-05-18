import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";

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
  trustHost: true
});
