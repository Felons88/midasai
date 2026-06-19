'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth, requireResourceOwnership } from '@/lib/database/rbac';
import {
  CreateReviewSchema,
  UpdateReviewSchema,
  type CreateReviewInput,
  type UpdateReviewInput,
} from '@/lib/database/validations';
import type { Review, ReviewWithUser } from '@/lib/database/types';

// =============================================================================
// Review Server Actions
// =============================================================================

interface ActionResult<T> {
  data: T | null;
  error: string | null;
}

// -----------------------------------------------------------------------------
// Create Review
// -----------------------------------------------------------------------------

export async function createReview(input: CreateReviewInput): Promise<ActionResult<Review>> {
  try {
    const ctx = await requireAuth();
    const validated = CreateReviewSchema.parse(input);

    const supabase = await createClient();

    // Check if user already reviewed this listing
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('listing_id', validated.listing_id)
      .eq('user_id', ctx.profile.id)
      .single();

    if (existing) {
      return { data: null, error: 'You have already reviewed this listing' };
    }

    // Check if user owns the listing (can't review own listing)
    const { data: listing } = await supabase
      .from('listings')
      .select('creator_id')
      .eq('id', validated.listing_id)
      .single();

    if (listing?.creator_id === ctx.profile.id) {
      return { data: null, error: 'You cannot review your own listing' };
    }

    // Check if user has purchased (for verified purchase badge)
    const { data: purchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('listing_id', validated.listing_id)
      .eq('user_id', ctx.profile.id)
      .single();

    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        ...validated,
        user_id: ctx.profile.id,
        is_verified_purchase: !!purchase,
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    return { data: review as Review, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to create review' };
  }
}

// -----------------------------------------------------------------------------
// Update Review
// -----------------------------------------------------------------------------

export async function updateReview(
  reviewId: string,
  input: UpdateReviewInput
): Promise<ActionResult<Review>> {
  try {
    const ctx = await requireAuth();
    const validated = UpdateReviewSchema.parse(input);

    const supabase = await createClient();

    const { data: existing, error: fetchError } = await supabase
      .from('reviews')
      .select('user_id')
      .eq('id', reviewId)
      .single();

    if (fetchError || !existing) return { data: null, error: 'Review not found' };
    requireResourceOwnership(ctx, existing.user_id);

    const { data: review, error } = await supabase
      .from('reviews')
      .update(validated)
      .eq('id', reviewId)
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    return { data: review as Review, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to update review' };
  }
}

// -----------------------------------------------------------------------------
// Delete Review
// -----------------------------------------------------------------------------

export async function deleteReview(reviewId: string): Promise<ActionResult<{ deleted: boolean }>> {
  try {
    const ctx = await requireAuth();
    const supabase = await createClient();

    const { data: existing, error: fetchError } = await supabase
      .from('reviews')
      .select('user_id')
      .eq('id', reviewId)
      .single();

    if (fetchError || !existing) return { data: null, error: 'Review not found' };
    requireResourceOwnership(ctx, existing.user_id);

    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
    if (error) return { data: null, error: error.message };

    return { data: { deleted: true }, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to delete review' };
  }
}

// -----------------------------------------------------------------------------
// Get Reviews for Listing
// -----------------------------------------------------------------------------

export async function getListingReviews(
  listingId: string,
  page: number = 1,
  perPage: number = 10
): Promise<ActionResult<{ reviews: ReviewWithUser[]; total: number }>> {
  try {
    const supabase = await createClient();
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data: reviews, error, count } = await supabase
      .from('reviews')
      .select(
        `*, user:profiles!user_id(id, username, display_name, avatar_url)`,
        { count: 'exact' }
      )
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) return { data: null, error: error.message };

    return {
      data: {
        reviews: (reviews ?? []) as unknown as ReviewWithUser[],
        total: count ?? 0,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch reviews' };
  }
}

// -----------------------------------------------------------------------------
// Get User's Reviews
// -----------------------------------------------------------------------------

export async function getUserReviews(): Promise<ActionResult<Review[]>> {
  try {
    const ctx = await requireAuth();
    const supabase = await createClient();

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', ctx.profile.id)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error: error.message };

    return { data: (reviews ?? []) as Review[], error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch reviews' };
  }
}

// -----------------------------------------------------------------------------
// Mark Review as Helpful
// -----------------------------------------------------------------------------

export async function markReviewHelpful(reviewId: string): Promise<ActionResult<{ count: number }>> {
  try {
    await requireAuth();
    const supabase = await createClient();

    // Use RPC for atomic increment
    const { error: rpcError } = await supabase.rpc('increment_review_helpful', {
      review_id: reviewId,
    });

    if (rpcError) return { data: null, error: rpcError.message };

    const { data: updated } = await supabase
      .from('reviews')
      .select('helpful_count')
      .eq('id', reviewId)
      .single();

    return { data: { count: updated?.helpful_count ?? 1 }, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to mark review helpful' };
  }
}
