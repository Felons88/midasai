import { createClient } from '@/lib/supabase/server'

export type UserRole = 'USER' | 'CREATOR' | 'ADMIN' | 'MODERATOR' | 'OWNER'

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  USER: 1,
  CREATOR: 2,
  MODERATOR: 3,
  ADMIN: 4,
  OWNER: 5,
}

/**
 * Check if a user has a specific role
 */
export async function hasRole(userId: string, role: UserRole): Promise<boolean> {
  const supabase = await createClient()
  
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()
  
  if (!user) return false
  
  return user.role === role
}

/**
 * Check if a user has at least a specific role level
 */
export async function hasRoleAtLeast(userId: string, role: UserRole): Promise<boolean> {
  const supabase = await createClient()
  
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()
  
  if (!user) return false
  
  const userRoleLevel = ROLE_HIERARCHY[user.role as UserRole] || 0
  const requiredRoleLevel = ROLE_HIERARCHY[role]
  
  return userRoleLevel >= requiredRoleLevel
}

/**
 * Get user role
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  const supabase = await createClient()
  
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()
  
  return user?.role as UserRole || null
}

/**
 * Upgrade user to creator role
 */
export async function upgradeToCreator(userId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('users')
    .update({ role: 'CREATOR' })
    .eq('id', userId)
  
  return !error
}

/**
 * Check if user can access admin routes
 */
export async function canAccessAdmin(userId: string): Promise<boolean> {
  return hasRoleAtLeast(userId, 'ADMIN')
}

/**
 * Check if user can access creator routes
 */
export async function canAccessCreator(userId: string): Promise<boolean> {
  return hasRoleAtLeast(userId, 'CREATOR')
}

/**
 * Check if user can access developer routes
 */
export async function canAccessDeveloper(userId: string): Promise<boolean> {
  return hasRoleAtLeast(userId, 'USER')
}
