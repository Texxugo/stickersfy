import { prisma } from "@/lib/db";

// Emails fixos vindos do ambiente (bootstrap / anti-trava). Continuam valendo
// sempre; o painel admin so gerencia os do banco.
export function getEarlyAccessEmails() {
  const single = process.env.EARLY_ACCESS_EMAIL ?? "";
  const multi = process.env.EARLY_ACCESS_EMAILS ?? "";

  const values = `${single},${multi}`
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return Array.from(new Set(values));
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Acesso antecipado liberado se o email estiver no ambiente OU no banco.
export async function isEarlyAccessEmail(email: string) {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  if (getEarlyAccessEmails().includes(normalized)) return true;

  try {
    const record = await prisma.earlyAccessEmail.findUnique({
      where: { email: normalized },
      select: { id: true }
    });
    return Boolean(record);
  } catch {
    // Banco indisponivel: cai no fallback do ambiente (ja checado acima).
    return false;
  }
}

export type EarlyAccessEntry = {
  email: string;
  note: string | null;
  source: "env" | "db";
  createdAt: Date | null;
};

// Lista unificada para o painel: fixos do ambiente + gerenciaveis do banco.
export async function listEarlyAccessEmails(): Promise<EarlyAccessEntry[]> {
  const envEmails = getEarlyAccessEmails();
  const envEntries: EarlyAccessEntry[] = envEmails.map((email) => ({
    email,
    note: null,
    source: "env",
    createdAt: null
  }));

  let dbEntries: EarlyAccessEntry[] = [];
  try {
    const rows = await prisma.earlyAccessEmail.findMany({
      orderBy: { createdAt: "desc" }
    });
    dbEntries = rows
      .filter((row) => !envEmails.includes(row.email))
      .map((row) => ({
        email: row.email,
        note: row.note,
        source: "db",
        createdAt: row.createdAt
      }));
  } catch {
    dbEntries = [];
  }

  return [...dbEntries, ...envEntries];
}

export async function addEarlyAccessEmail(email: string, note?: string) {
  const normalized = normalizeEmail(email);
  if (!normalized || !isValidEmail(normalized)) {
    throw new Error("E-mail invalido.");
  }

  const cleanNote = note?.trim() || null;

  await prisma.earlyAccessEmail.upsert({
    where: { email: normalized },
    update: { note: cleanNote },
    create: { email: normalized, note: cleanNote }
  });
}

export async function removeEarlyAccessEmail(email: string) {
  const normalized = normalizeEmail(email);
  if (!normalized) return;

  await prisma.earlyAccessEmail.deleteMany({
    where: { email: normalized }
  });
}
