'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth, requireResourceOwnership } from '@/lib/database/rbac';
import {
  CreateCreatorProfileSchema,
  UpdateCreatorProfileSchema,
  UpdateProfileSchema,
  ToggleFollowSchema,
  type CreateCreatorProfileInput,
  type UpdateCreatorProfileInput,
  type UpdateProfileInput,
  type ToggleFollowInput,
} from '@/lib/database/validations';
import type { Profile, CreatorProfile, CreatorWithProfile } from '@/lib/database/types';

// =============================================================================
// Creator & Profile Server Actions
// =============================================================================

interface ActionResult<T> {
  data: T | null;
  error: string | null;
}

// -----------------------------------------------------------------------------
// Profile Management
// -----------------------------------------------------------------------------

export async function getProfile(): Promise<ActionResult<Profile>> {
  try {
    const ctx = await requireAuth();
    const supabase = await createClient();

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', ctx.profile.id)
      .single();

    if (error) return { data: null, error: error.message };

    return { data: profile as Profile, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch profile' };
  }
}

export async function getPublicProfile(username: string): Promise<ActionResult<Profile>> {
  try {
    const supabase = await createClient();

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (error) return { data: null, error: error.message };

    return { data: profile as Profile, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch profile' };
  }
}

export async function updateProfile(input: UpdateProfileInput): Promise<ActionResult<Profile>> {
  try {
    const ctx = await requireAuth();
    const validated = UpdateProfileSchema.parse(input);
    const supabase = await createClient();

    // Check username uniqueness if updating username
    if (validated.username && validated.username !== ctx.profile.username) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', validated.username)
        .single();

      if (existing) {
        return { data: null, error: 'Username is already taken' };
      }
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(validated)
      .eq('id', ctx.profile.id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    return { data: profile as Profile, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to update profile' };
  }
}

// -----------------------------------------------------------------------------
// Creator Profile
// -----------------------------------------------------------------------------

export async function createCreatorProfile(
  input: CreateCreatorProfileInput
): Promise<ActionResult<CreatorProfile>> {
  try {
    const ctx = await requireAuth();
    const validated = CreateCreatorProfileSchema.parse(input);
    const supabase = await createClient();

    // Check if creator profile already exists
    const { data: existing } = await supabase
      .from('creator_profiles')
      .select('id')
      .eq('user_id', ctx.profile.id)
      .single();

    if (existing) {
      return { data: null, error: 'Creator profile already exists' };
    }

    // Create creator profile
    const { data: creatorProfile, error } = await supabase
      .from('creator_profiles')
      .insert({
        ...validated,
        user_id: ctx.profile.id,
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    // Upgrade user role to creator
    await supabase
      .from('profiles')
      .update({ role: 'creator' })
      .eq('id', ctx.profile.id);

    return { data: creatorProfile as CreatorProfile, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to create creator profile' };
  }
}

export async function updateCreatorProfile(
  input: UpdateCreatorProfileInput
): Promise<ActionResult<CreatorProfile>> {
  try {
    const ctx = await requireAuth();
    const validated = UpdateCreatorProfileSchema.parse(input);
    const supabase = await createClient();

    const { data: existing, error: fetchError } = await supabase
      .from('creator_profiles')
      .select('id, user_id')
      .eq('user_id', ctx.profile.id)
      .single();

    if (fetchError || !existing) {
      return { data: null, error: 'Creator profile not found' };
    }

    const { data: creatorProfile, error } = await supabase
      .from('creator_profiles')
      .update(validated)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    return { data: creatorProfile as CreatorProfile, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to update creator profile' };
  }
}

export async function getCreatorProfile(userId?: string): Promise<ActionResult<CreatorWithProfile>> {
  try {
    const supabase = await createClient();

    let targetId = userId;
    if (!targetId) {
      const ctx = await requireAuth();
      targetId = ctx.profile.id;
    }

    const { data: creatorProfile, error } = await supabase
      .from('creator_profiles')
      .select(`
        *,
        profile:profiles!user_id(id, username, display_name, avatar_url, is_verified)
      `)
      .eq('user_id', targetId)
      .single();

    if (error) return { data: null, error: error.message };

    return { data: creatorProfile as unknown as CreatorWithProfile, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch creator profile' };
  }
}

export async function getFeaturedCreators(limit: number = 10): Promise<ActionResult<CreatorWithProfile[]>> {
  try {
    const supabase = await createClient();

    const { data: creators, error } = await supabase
      .from('creator_profiles')
      .select(`
        *,
        profile:profiles!user_id(id, username, display_name, avatar_url, is_verified)
      `)
      .eq('is_featured', true)
      .order('total_downloads', { ascending: false })
      .limit(limit);

    if (error) return { data: null, error: error.message };

    return { data: (creators ?? []) as unknown as CreatorWithProfile[], error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch creators' };
  }
}

// -----------------------------------------------------------------------------
// Follows
// -----------------------------------------------------------------------------

export async function toggleFollow(input: ToggleFollowInput): Promise<ActionResult<{ following: boolean }>> {
  try {
    const ctx = await requireAuth();
    const validated = ToggleFollowSchema.parse(input);
    const supabase = await createClient();

    if (validated.user_id === ctx.profile.id) {
      return { data: null, error: 'You cannot follow yourself' };
    }

    // Check if already following
    const { data: existing } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', ctx.profile.id)
      .eq('following_id', validated.user_id)
      .single();

    if (existing) {
      // Unfollow
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', ctx.profile.id)
        .eq('following_id', validated.user_id);

      if (error) return { data: null, error: error.message };
      return { data: { following: false }, error: null };
    } else {
      // Follow
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: ctx.profile.id,
          following_id: validated.user_id,
        });

      if (error) return { data: null, error: error.message };
      return { data: { following: true }, error: null };
    }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to toggle follow' };
  }
}

export async function isFollowing(userId: string): Promise<boolean> {
  try {
    const ctx = await requireAuth();
    const supabase = await createClient();

    const { data } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', ctx.profile.id)
      .eq('following_id', userId)
      .single();

    return !!data;
  } catch {
    return false;
  }
}

export async function getFollowers(userId: string): Promise<ActionResult<Profile[]>> {
  try {
    const supabase = await createClient();

    const { data: follows, error } = await supabase
      .from('follows')
      .select('follower:profiles!follower_id(*)')
      .eq('following_id', userId);

    if (error) return { data: null, error: error.message };

    const followers = follows?.map((f) => (f as unknown as { follower: Profile }).follower) ?? [];
    return { data: followers, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch followers' };
  }
}

export async function getFollowing(userId: string): Promise<ActionResult<Profile[]>> {
  try {
    const supabase = await createClient();

    const { data: follows, error } = await supabase
      .from('follows')
      .select('following:profiles!following_id(*)')
      .eq('follower_id', userId);

    if (error) return { data: null, error: error.message };

    const following = follows?.map((f) => (f as unknown as { following: Profile }).following) ?? [];
    return { data: following, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch following' };
  }
}
