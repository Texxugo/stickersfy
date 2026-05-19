import { auth } from "@/auth";
import { getAccessDecision } from "@/lib/access-control";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();

  if (session?.user?.email) {
    const decision = await getAccessDecision(session.user.email);
    redirect(decision.allowed ? "/gallery" : "/no-access");
  }

  redirect("/login");
}
