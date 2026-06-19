'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth, requireCreator, requireResourceOwnership, requireModerator } from '@/lib/database/rbac';
import {
  CreateListingSchema,
  UpdateListingSchema,
  ListingSearchSchema,
  ModerateListingSchema,
  type CreateListingInput,
  type UpdateListingInput,
  type ListingSearchInput,
  type ModerateListingInput,
} from '@/lib/database/validations';
import type { Listing, ListingWithCreator, ListingWithDetails } from '@/lib/database/types';

// =============================================================================
// Listing Server Actions
// =============================================================================

interface ActionResult<T> {
  data: T | null;
  error: string | null;
}

// -----------------------------------------------------------------------------
// Create Listing
// -----------------------------------------------------------------------------

export async function createListing(input: CreateListingInput): Promise<ActionResult<Listing>> {
  try {
    const ctx = await requireCreator();
    const validated = CreateListingSchema.parse(input);

    const supabase = await createClient();

    const { tag_ids, ...listingData } = validated;

    const { data: listing, error } = await supabase
      .from('listings')
      .insert({
        ...listingData,
        creator_id: ctx.profile.id,
        status: 'draft',
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    // Insert tag associations if provided
    if (tag_ids && tag_ids.length > 0) {
      const tagRows = tag_ids.map((tag_id) => ({
        listing_id: listing.id,
        tag_id,
      }));
      await supabase.from('listing_tags').insert(tagRows);
    }

    return { data: listing as Listing, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to create listing' };
  }
}

// -----------------------------------------------------------------------------
// Update Listing
// -----------------------------------------------------------------------------

export async function updateListing(
  listingId: string,
  input: UpdateListingInput
): Promise<ActionResult<Listing>> {
  try {
    const ctx = await requireAuth();
    const validated = UpdateListingSchema.parse(input);

    const supabase = await createClient();

    // Fetch listing to check ownership
    const { data: existing, error: fetchError } = await supabase
      .from('listings')
      .select('creator_id')
      .eq('id', listingId)
      .single();

    if (fetchError || !existing) return { data: null, error: 'Listing not found' };
    requireResourceOwnership(ctx, existing.creator_id);

    const { tag_ids, ...listingData } = validated;

    const { data: listing, error } = await supabase
      .from('listings')
      .update(listingData)
      .eq('id', listingId)
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    // Update tags if provided
    if (tag_ids !== undefined) {
      await supabase.from('listing_tags').delete().eq('listing_id', listingId);
      if (tag_ids.length > 0) {
        const tagRows = tag_ids.map((tag_id) => ({
          listing_id: listingId,
          tag_id,
        }));
        await supabase.from('listing_tags').insert(tagRows);
      }
    }

    return { data: listing as Listing, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to update listing' };
  }
}

// -----------------------------------------------------------------------------
// Delete Listing
// -----------------------------------------------------------------------------

export async function deleteListing(listingId: string): Promise<ActionResult<{ deleted: boolean }>> {
  try {
    const ctx = await requireAuth();
    const supabase = await createClient();

    const { data: existing, error: fetchError } = await supabase
      .from('listings')
      .select('creator_id, status')
      .eq('id', listingId)
      .single();

    if (fetchError || !existing) return { data: null, error: 'Listing not found' };
    requireResourceOwnership(ctx, existing.creator_id);

    const { error } = await supabase.from('listings').delete().eq('id', listingId);
    if (error) return { data: null, error: error.message };

    return { data: { deleted: true }, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to delete listing' };
  }
}

// -----------------------------------------------------------------------------
// Publish Listing (submit for review)
// -----------------------------------------------------------------------------

export async function publishListing(listingId: string): Promise<ActionResult<Listing>> {
  try {
    const ctx = await requireAuth();
    const supabase = await createClient();

    const { data: existing, error: fetchError } = await supabase
      .from('listings')
      .select('creator_id, status')
      .eq('id', listingId)
      .single();

    if (fetchError || !existing) return { data: null, error: 'Listing not found' };
    requireResourceOwnership(ctx, existing.creator_id);

    if (existing.status !== 'draft' && existing.status !== 'rejected') {
      return { data: null, error: 'Only draft or rejected listings can be submitted for review' };
    }

    const { data: listing, error } = await supabase
      .from('listings')
      .update({ status: 'pending_review' })
      .eq('id', listingId)
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    return { data: listing as Listing, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to publish listing' };
  }
}

// -----------------------------------------------------------------------------
// Moderate Listing (admin/moderator)
// -----------------------------------------------------------------------------

export async function moderateListing(input: ModerateListingInput): Promise<ActionResult<Listing>> {
  try {
    await requireModerator();
    const validated = ModerateListingSchema.parse(input);
    const supabase = await createClient();

    const statusMap: Record<string, string> = {
      approve: 'published',
      reject: 'rejected',
      suspend: 'suspended',
    };

    const newStatus = statusMap[validated.action];
    const updateData: Record<string, unknown> = { status: newStatus };

    if (newStatus === 'published') {
      updateData.published_at = new Date().toISOString();
    }

    const { data: listing, error } = await supabase
      .from('listings')
      .update(updateData)
      .eq('id', validated.listing_id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    return { data: listing as Listing, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to moderate listing' };
  }
}

// -----------------------------------------------------------------------------
// Get Listing by ID
// -----------------------------------------------------------------------------

export async function getListingById(listingId: string): Promise<ActionResult<ListingWithDetails>> {
  try {
    const supabase = await createClient();

    const { data: listing, error } = await supabase
      .from('listings')
      .select(`
        *,
        creator:profiles!creator_id(id, username, display_name, avatar_url, is_verified),
        category:categories(id, name, slug)
      `)
      .eq('id', listingId)
      .single();

    if (error) return { data: null, error: error.message };

    // Fetch tags separately
    const { data: tagLinks } = await supabase
      .from('listing_tags')
      .select('tag_id, tags(id, name, slug)')
      .eq('listing_id', listingId);

    const tags = tagLinks?.map((link) => (link as unknown as { tags: { id: string; name: string; slug: string } }).tags) ?? [];

    return {
      data: { ...listing, tags } as unknown as ListingWithDetails,
      error: null,
    };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch listing' };
  }
}

// -----------------------------------------------------------------------------
// Get Listing by Slug
// -----------------------------------------------------------------------------

export async function getListingBySlug(slug: string): Promise<ActionResult<ListingWithDetails>> {
  try {
    const supabase = await createClient();

    const { data: listing, error } = await supabase
      .from('listings')
      .select(`
        *,
        creator:profiles!creator_id(id, username, display_name, avatar_url, is_verified),
        category:categories(id, name, slug)
      `)
      .eq('slug', slug)
      .single();

    if (error) return { data: null, error: error.message };

    const { data: tagLinks } = await supabase
      .from('listing_tags')
      .select('tag_id, tags(id, name, slug)')
      .eq('listing_id', listing.id);

    const tags = tagLinks?.map((link) => (link as unknown as { tags: { id: string; name: string; slug: string } }).tags) ?? [];

    return {
      data: { ...listing, tags } as unknown as ListingWithDetails,
      error: null,
    };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch listing' };
  }
}

// -----------------------------------------------------------------------------
// Search Listings
// -----------------------------------------------------------------------------

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export async function searchListings(
  input: ListingSearchInput
): Promise<ActionResult<PaginatedResult<ListingWithCreator>>> {
  try {
    const validated = ListingSearchSchema.parse(input);
    const supabase = await createClient();

    const { query, type, category_id, platforms, pricing_model, min_rating, tags, creator_id, sort_by, page, per_page } = validated;

    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    let queryBuilder = supabase
      .from('listings')
      .select(
        `*, creator:profiles!creator_id(id, username, display_name, avatar_url, is_verified)`,
        { count: 'exact' }
      )
      .eq('status', 'published');

    // Apply filters
    if (query) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%,short_description.ilike.%${query}%`);
    }
    if (type) {
      queryBuilder = queryBuilder.eq('type', type);
    }
    if (category_id) {
      queryBuilder = queryBuilder.eq('category_id', category_id);
    }
    if (platforms && platforms.length > 0) {
      queryBuilder = queryBuilder.overlaps('platforms', platforms);
    }
    if (pricing_model) {
      queryBuilder = queryBuilder.eq('pricing_model', pricing_model);
    }
    if (min_rating) {
      queryBuilder = queryBuilder.gte('average_rating', min_rating);
    }
    if (creator_id) {
      queryBuilder = queryBuilder.eq('creator_id', creator_id);
    }

    // Apply sorting
    switch (sort_by) {
      case 'popular':
        queryBuilder = queryBuilder.order('view_count', { ascending: false });
        break;
      case 'downloads':
        queryBuilder = queryBuilder.order('download_count', { ascending: false });
        break;
      case 'rating':
        queryBuilder = queryBuilder.order('average_rating', { ascending: false });
        break;
      case 'price_asc':
        queryBuilder = queryBuilder.order('price', { ascending: true });
        break;
      case 'price_desc':
        queryBuilder = queryBuilder.order('price', { ascending: false });
        break;
      case 'newest':
      default:
        queryBuilder = queryBuilder.order('published_at', { ascending: false });
        break;
    }

    queryBuilder = queryBuilder.range(from, to);

    const { data: listings, error, count } = await queryBuilder;

    if (error) return { data: null, error: error.message };

    const total = count ?? 0;

    return {
      data: {
        data: (listings ?? []) as unknown as ListingWithCreator[],
        total,
        page,
        per_page,
        total_pages: Math.ceil(total / per_page),
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to search listings' };
  }
}

// -----------------------------------------------------------------------------
// Get Creator's Listings
// -----------------------------------------------------------------------------

export async function getCreatorListings(
  creatorId?: string
): Promise<ActionResult<Listing[]>> {
  try {
    const ctx = await requireAuth();
    const supabase = await createClient();
    const targetId = creatorId ?? ctx.profile.id;

    const { data: listings, error } = await supabase
      .from('listings')
      .select('*')
      .eq('creator_id', targetId)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error: error.message };

    return { data: (listings ?? []) as Listing[], error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch listings' };
  }
}

// -----------------------------------------------------------------------------
// Increment View Count
// -----------------------------------------------------------------------------

export async function incrementViewCount(listingId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc('increment_view_count', { listing_id: listingId });
}
