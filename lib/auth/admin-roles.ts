/** Client-safe admin role checks (no server imports). */

export const ADMIN_ROLES = new Set(["ADMIN", "OWNER", "MODERATOR"])

export function isAdminRole(role: string | null | undefined): boolean {
  return !!role && ADMIN_ROLES.has(role)
}
