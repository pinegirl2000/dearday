export const ADMIN_EMAILS = new Set<string>(['pinegirl2000@gmail.com']);

export function isAdminEmail(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.has(email.toLowerCase());
}
