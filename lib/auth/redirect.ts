/** Returns an in-app path safe for post-auth redirect, or null if invalid. */
export function getSafeRedirectPath(redirect: string | null | undefined): string | null {
  if (!redirect) return null
  if (!redirect.startsWith("/") || redirect.startsWith("//")) return null
  if (redirect.includes("://")) return null
  return redirect
}
