export function getEarlyAccessEmails() {
  const single = process.env.EARLY_ACCESS_EMAIL ?? "";
  const multi = process.env.EARLY_ACCESS_EMAILS ?? "";

  const values = `${single},${multi}`
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return Array.from(new Set(values));
}

export function isEarlyAccessEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  return getEarlyAccessEmails().includes(normalized);
}
