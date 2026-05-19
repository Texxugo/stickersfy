export function getAdminEmails() {
  const single = process.env.ADMIN_EMAIL ?? "";
  const multi = process.env.ADMIN_EMAILS ?? "";

  const values = `${single},${multi}`
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return Array.from(new Set(values));
}

export function isAdminEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  return getAdminEmails().includes(normalized);
}
