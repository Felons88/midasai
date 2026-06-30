import type { ApiKeyContext } from "@/lib/api/api-key-auth"

const AUTH_CACHE_TTL_MS = 60_000
const LAST_USED_THROTTLE_MS = 5 * 60_000

type CachedAuth = {
  ctx: ApiKeyContext
  rateLimit: number
  expiresAt: number
}

const authByHash = new Map<string, CachedAuth>()
const lastUsedAtByKeyId = new Map<string, number>()

export function getCachedAuth(keyHash: string): CachedAuth | null {
  const entry = authByHash.get(keyHash)
  if (!entry) return null
  if (entry.expiresAt <= Date.now()) {
    authByHash.delete(keyHash)
    return null
  }
  return entry
}

export function setCachedAuth(
  keyHash: string,
  ctx: ApiKeyContext,
  rateLimit: number
): void {
  authByHash.set(keyHash, {
    ctx,
    rateLimit,
    expiresAt: Date.now() + AUTH_CACHE_TTL_MS,
  })
}

export function shouldUpdateLastUsed(keyId: string): boolean {
  const now = Date.now()
  const last = lastUsedAtByKeyId.get(keyId) ?? 0
  if (now - last < LAST_USED_THROTTLE_MS) return false
  lastUsedAtByKeyId.set(keyId, now)
  return true
}
