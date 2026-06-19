import { createClient } from '@/lib/supabase/server';
import type { UserRole, Profile } from './types';

// =============================================================================
// RBAC (Role-Based Access Control) Utilities
// =============================================================================
// Server-side authorization helpers for MidasAI.
// Provides role checking, permission guards, and auth context.
// =============================================================================

// Role hierarchy (higher index = more privileges)
const ROLE_HIERARCHY: UserRole[] = ['user', 'creator', 'moderator', 'admin', 'owner'];

/**
 * Get the numeric level of a role for comparison.
 */
function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY.indexOf(role);
}

/**
 * Check if a role meets the minimum required level.
 */
export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
}

// -----------------------------------------------------------------------------
// Auth Context
// -----------------------------------------------------------------------------

export interface AuthContext {
  user: {
    id: string;
    email: string;
  };
  profile: Profile;
}

/**
 * Get the current authenticated user and their profile.
 * Returns null if not authenticated.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) return null;

  return {
    user: { id: user.id, email: user.email ?? '' },
    profile: profile as Profile,
  };
}

/**
 * Require authentication. Throws if not authenticated.
 */
export async function requireAuth(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) {
    throw new Error('Authentication required');
  }
  return ctx;
}

/**
 * Require a minimum role. Throws if role is insufficient.
 */
export async function requireRole(minimumRole: UserRole): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (!hasMinimumRole(ctx.profile.role, minimumRole)) {
    throw new Error(`Insufficient permissions. Required role: ${minimumRole}`);
  }
  return ctx;
}

/**
 * Require the user to be a creator (or higher).
 */
export async function requireCreator(): Promise<AuthContext> {
  return requireRole('creator');
}

/**
 * Require the user to be a moderator (or higher).
 */
export async function requireModerator(): Promise<AuthContext> {
  return requireRole('moderator');
}

/**
 * Require the user to be an admin (or higher).
 */
export async function requireAdmin(): Promise<AuthContext> {
  return requireRole('admin');
}

/**
 * Require the user to be the owner.
 */
export async function requireOwner(): Promise<AuthContext> {
  return requireRole('owner');
}

// -----------------------------------------------------------------------------
// Resource-Level Authorization
// -----------------------------------------------------------------------------

/**
 * Check if the user owns the resource or has admin privileges.
 */
export function canModifyResource(ctx: AuthContext, resourceOwnerId: string): boolean {
  return ctx.profile.id === resourceOwnerId || hasMinimumRole(ctx.profile.role, 'admin');
}

/**
 * Require that the user owns the resource or has admin privileges.
 */
export function requireResourceOwnership(ctx: AuthContext, resourceOwnerId: string): void {
  if (!canModifyResource(ctx, resourceOwnerId)) {
    throw new Error('You do not have permission to modify this resource');
  }
}

// -----------------------------------------------------------------------------
// Permission Checks (non-throwing)
// -----------------------------------------------------------------------------

export function canCreateListing(ctx: AuthContext): boolean {
  return hasMinimumRole(ctx.profile.role, 'creator');
}

export function canModerateListing(ctx: AuthContext): boolean {
  return hasMinimumRole(ctx.profile.role, 'moderator');
}

export function canManageUsers(ctx: AuthContext): boolean {
  return hasMinimumRole(ctx.profile.role, 'admin');
}

export function canAccessAdminPanel(ctx: AuthContext): boolean {
  return hasMinimumRole(ctx.profile.role, 'moderator');
}

export function canManageSiteSettings(ctx: AuthContext): boolean {
  return hasMinimumRole(ctx.profile.role, 'admin');
}
