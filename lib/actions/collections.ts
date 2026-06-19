'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth, requireResourceOwnership } from '@/lib/database/rbac';
import {
  CreateCollectionSchema,
  UpdateCollectionSchema,
  AddToCollectionSchema,
  ToggleBookmarkSchema,
  type CreateCollectionInput,
  type UpdateCollectionInput,
  type AddToCollectionInput,
  type ToggleBookmarkInput,
} from '@/lib/database/validations';
import type { Collection, Bookmark, CollectionItem } from '@/lib/database/types';

// =============================================================================
// Collections & Bookmarks Server Actions
// =============================================================================

interface ActionResult<T> {
  data: T | null;
  error: string | null;
}

// -----------------------------------------------------------------------------
// Collections
// -----------------------------------------------------------------------------

export async function createCollection(input: CreateCollectionInput): Promise<ActionResult<Collection>> {
  try {
    const ctx = await requireAuth();
    const validated = CreateCollectionSchema.parse(input);
    const supabase = await createClient();

    const { data: collection, error } = await supabase
      .from('collections')
      .insert({
        ...validated,
        user_id: ctx.profile.id,
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    return { data: collection as Collection, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to create collection' };
  }
}

export async function updateCollection(
  collectionId: string,
  input: UpdateCollectionInput
): Promise<ActionResult<Collection>> {
  try {
    const ctx = await requireAuth();
    const validated = UpdateCollectionSchema.parse(input);
    const supabase = await createClient();

    const { data: existing, error: fetchError } = await supabase
      .from('collections')
      .select('user_id')
      .eq('id', collectionId)
      .single();

    if (fetchError || !existing) return { data: null, error: 'Collection not found' };
    requireResourceOwnership(ctx, existing.user_id);

    const { data: collection, error } = await supabase
      .from('collections')
      .update(validated)
      .eq('id', collectionId)
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    return { data: collection as Collection, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to update collection' };
  }
}

export async function deleteCollection(collectionId: string): Promise<ActionResult<{ deleted: boolean }>> {
  try {
    const ctx = await requireAuth();
    const supabase = await createClient();

    const { data: existing, error: fetchError } = await supabase
      .from('collections')
      .select('user_id')
      .eq('id', collectionId)
      .single();

    if (fetchError || !existing) return { data: null, error: 'Collection not found' };
    requireResourceOwnership(ctx, existing.user_id);

    const { error } = await supabase.from('collections').delete().eq('id', collectionId);
    if (error) return { data: null, error: error.message };

    return { data: { deleted: true }, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to delete collection' };
  }
}

export async function addToCollection(input: AddToCollectionInput): Promise<ActionResult<CollectionItem>> {
  try {
    const ctx = await requireAuth();
    const validated = AddToCollectionSchema.parse(input);
    const supabase = await createClient();

    // Verify ownership
    const { data: collection, error: fetchError } = await supabase
      .from('collections')
      .select('user_id')
      .eq('id', validated.collection_id)
      .single();

    if (fetchError || !collection) return { data: null, error: 'Collection not found' };
    requireResourceOwnership(ctx, collection.user_id);

    const { data: item, error } = await supabase
      .from('collection_items')
      .insert({
        collection_id: validated.collection_id,
        listing_id: validated.listing_id,
        sort_order: validated.sort_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { data: null, error: 'Listing already in collection' };
      }
      return { data: null, error: error.message };
    }

    return { data: item as CollectionItem, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to add to collection' };
  }
}

export async function removeFromCollection(
  collectionId: string,
  listingId: string
): Promise<ActionResult<{ removed: boolean }>> {
  try {
    const ctx = await requireAuth();
    const supabase = await createClient();

    const { data: collection, error: fetchError } = await supabase
      .from('collections')
      .select('user_id')
      .eq('id', collectionId)
      .single();

    if (fetchError || !collection) return { data: null, error: 'Collection not found' };
    requireResourceOwnership(ctx, collection.user_id);

    const { error } = await supabase
      .from('collection_items')
      .delete()
      .eq('collection_id', collectionId)
      .eq('listing_id', listingId);

    if (error) return { data: null, error: error.message };

    return { data: { removed: true }, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to remove from collection' };
  }
}

export async function getUserCollections(): Promise<ActionResult<Collection[]>> {
  try {
    const ctx = await requireAuth();
    const supabase = await createClient();

    const { data: collections, error } = await supabase
      .from('collections')
      .select('*')
      .eq('user_id', ctx.profile.id)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error: error.message };

    return { data: (collections ?? []) as Collection[], error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch collections' };
  }
}

export async function getPublicCollection(collectionId: string): Promise<ActionResult<Collection>> {
  try {
    const supabase = await createClient();

    const { data: collection, error } = await supabase
      .from('collections')
      .select('*')
      .eq('id', collectionId)
      .eq('is_public', true)
      .single();

    if (error) return { data: null, error: error.message };

    return { data: collection as Collection, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch collection' };
  }
}

// -----------------------------------------------------------------------------
// Bookmarks
// -----------------------------------------------------------------------------

export async function toggleBookmark(input: ToggleBookmarkInput): Promise<ActionResult<{ bookmarked: boolean }>> {
  try {
    const ctx = await requireAuth();
    const validated = ToggleBookmarkSchema.parse(input);
    const supabase = await createClient();

    // Check if bookmark exists
    const { data: existing } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', ctx.profile.id)
      .eq('listing_id', validated.listing_id)
      .single();

    if (existing) {
      // Remove bookmark
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', ctx.profile.id)
        .eq('listing_id', validated.listing_id);

      if (error) return { data: null, error: error.message };
      return { data: { bookmarked: false }, error: null };
    } else {
      // Add bookmark
      const { error } = await supabase
        .from('bookmarks')
        .insert({
          user_id: ctx.profile.id,
          listing_id: validated.listing_id,
        });

      if (error) return { data: null, error: error.message };
      return { data: { bookmarked: true }, error: null };
    }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to toggle bookmark' };
  }
}

export async function getUserBookmarks(): Promise<ActionResult<Bookmark[]>> {
  try {
    const ctx = await requireAuth();
    const supabase = await createClient();

    const { data: bookmarks, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', ctx.profile.id)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error: error.message };

    return { data: (bookmarks ?? []) as Bookmark[], error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch bookmarks' };
  }
}

export async function isBookmarked(listingId: string): Promise<boolean> {
  try {
    const ctx = await requireAuth();
    const supabase = await createClient();

    const { data } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', ctx.profile.id)
      .eq('listing_id', listingId)
      .single();

    return !!data;
  } catch {
    return false;
  }
}
