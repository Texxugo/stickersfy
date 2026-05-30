export function isPanelBypassEnabled() {
  return process.env.AUTH_BYPASS_FOR_PANEL?.trim().toLowerCase() === "true";
}
