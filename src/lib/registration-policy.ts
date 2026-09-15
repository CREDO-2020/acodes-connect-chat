/**
 * Registration policy for Acodes.
 *
 * Today anyone with a valid email can join. When the class wants to restrict
 * sign-ups, add domains here (e.g. ["school.edu"]) and every new registration
 * must match one of them. Admin approval can be layered on top by defaulting
 * new profiles to the "pending" status and gating the app on it.
 */
export const ALLOWED_EMAIL_DOMAINS: string[] = [];

export const REQUIRE_ADMIN_APPROVAL = false;

export function isEmailAllowed(email: string): boolean {
  if (ALLOWED_EMAIL_DOMAINS.length === 0) return true;
  const domain = email.trim().toLowerCase().split("@")[1];
  if (!domain) return false;
  return ALLOWED_EMAIL_DOMAINS.some((allowed) => domain === allowed.toLowerCase());
}
