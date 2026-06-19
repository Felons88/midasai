'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth, requireAdmin } from '@/lib/database/rbac';
import {
  RecordDownloadSchema,
  CreatePurchaseSchema,
  type RecordDownloadInput,
  type CreatePurchaseInput,
} from '@/lib/database/validations';
import type { Download, Transaction, Purchase } from '@/lib/database/types';

// =============================================================================
// Downloads & Transactions Server Actions
// =============================================================================

interface ActionResult<T> {
  data: T | null;
  error: string | null;
}

// -----------------------------------------------------------------------------
// Downloads
// -----------------------------------------------------------------------------

export async function recordDownload(input: RecordDownloadInput): Promise<ActionResult<Download>> {
  try {
    const ctx = await requireAuth();
    const validated = RecordDownloadSchema.parse(input);
    const supabase = await createClient();

    // Check if user has access (free listing or has purchased)
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, pricing_model, price, status')
      .eq('id', validated.listing_id)
      .single();

    if (listingError || !listing) return { data: null, error: 'Listing not found' };

    if (listing.status !== 'published') {
      return { data: null, error: 'Listing is not available for download' };
    }

    // If paid listing, verify purchase
    if (listing.pricing_model !== 'free' && listing.price > 0) {
      const { data: purchase } = await supabase
        .from('purchases')
        .select('id')
        .eq('user_id', ctx.profile.id)
        .eq('listing_id', validated.listing_id)
        .single();

      // Also allow creator to download their own listing
      const { data: ownListing } = await supabase
        .from('listings')
        .select('id')
        .eq('id', validated.listing_id)
        .eq('creator_id', ctx.profile.id)
        .single();

      if (!purchase && !ownListing) {
        return { data: null, error: 'Purchase required to download this listing' };
      }
    }

    const { data: download, error } = await supabase
      .from('downloads')
      .insert({
        listing_id: validated.listing_id,
        user_id: ctx.profile.id,
        version: validated.version,
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    return { data: download as Download, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to record download' };
  }
}

export async function getUserDownloads(): Promise<ActionResult<Download[]>> {
  try {
    const ctx = await requireAuth();
    const supabase = await createClient();

    const { data: downloads, error } = await supabase
      .from('downloads')
      .select('*')
      .eq('user_id', ctx.profile.id)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error: error.message };

    return { data: (downloads ?? []) as Download[], error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch downloads' };
  }
}

// -----------------------------------------------------------------------------
// Transactions
// -----------------------------------------------------------------------------

export async function createPurchase(input: CreatePurchaseInput): Promise<ActionResult<Purchase>> {
  try {
    const ctx = await requireAuth();
    const validated = CreatePurchaseSchema.parse(input);
    const supabase = await createClient();

    // Get listing details
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, creator_id, price, pricing_model, status, title')
      .eq('id', validated.listing_id)
      .single();

    if (listingError || !listing) return { data: null, error: 'Listing not found' };

    if (listing.status !== 'published') {
      return { data: null, error: 'Listing is not available for purchase' };
    }

    if (listing.creator_id === ctx.profile.id) {
      return { data: null, error: 'You cannot purchase your own listing' };
    }

    // Check if already purchased
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', ctx.profile.id)
      .eq('listing_id', validated.listing_id)
      .single();

    if (existingPurchase) {
      return { data: null, error: 'You already own this listing' };
    }

    // For free listings, create purchase directly
    if (listing.pricing_model === 'free' || listing.price === 0) {
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: ctx.profile.id,
          listing_id: validated.listing_id,
        })
        .select()
        .single();

      if (purchaseError) return { data: null, error: purchaseError.message };
      return { data: purchase as Purchase, error: null };
    }

    // For paid listings, create transaction + purchase
    const platformFeePercent = 15;
    const platformFee = Number((listing.price * platformFeePercent / 100).toFixed(2));
    const netAmount = Number((listing.price - platformFee).toFixed(2));

    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        buyer_id: ctx.profile.id,
        seller_id: listing.creator_id,
        listing_id: validated.listing_id,
        type: 'purchase',
        status: 'completed', // In production, this would be 'pending' until Stripe confirms
        amount: listing.price,
        platform_fee: platformFee,
        net_amount: netAmount,
        currency: 'USD',
        metadata: { listing_title: listing.title },
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (txError) return { data: null, error: txError.message };

    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: ctx.profile.id,
        listing_id: validated.listing_id,
        transaction_id: transaction.id,
      })
      .select()
      .single();

    if (purchaseError) return { data: null, error: purchaseError.message };

    // Update creator earnings
    await supabase.rpc('increment_creator_earnings', {
      creator_user_id: listing.creator_id,
      amount: netAmount,
    });

    return { data: purchase as Purchase, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to complete purchase' };
  }
}

export async function getUserPurchases(): Promise<ActionResult<Purchase[]>> {
  try {
    const ctx = await requireAuth();
    const supabase = await createClient();

    const { data: purchases, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', ctx.profile.id)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error: error.message };

    return { data: (purchases ?? []) as Purchase[], error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch purchases' };
  }
}

export async function getUserTransactions(): Promise<ActionResult<Transaction[]>> {
  try {
    const ctx = await requireAuth();
    const supabase = await createClient();

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .or(`buyer_id.eq.${ctx.profile.id},seller_id.eq.${ctx.profile.id}`)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error: error.message };

    return { data: (transactions ?? []) as Transaction[], error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch transactions' };
  }
}

// Check if user has purchased a listing
export async function hasPurchased(listingId: string): Promise<boolean> {
  try {
    const ctx = await requireAuth();
    const supabase = await createClient();

    const { data } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', ctx.profile.id)
      .eq('listing_id', listingId)
      .single();

    return !!data;
  } catch {
    return false;
  }
}

// -----------------------------------------------------------------------------
// Admin: Get Platform Revenue
// -----------------------------------------------------------------------------

export async function getPlatformRevenue(): Promise<ActionResult<{ total: number; fees: number; count: number }>> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('amount, platform_fee')
      .eq('status', 'completed')
      .eq('type', 'purchase');

    if (error) return { data: null, error: error.message };

    const total = transactions?.reduce((sum, tx) => sum + Number(tx.amount), 0) ?? 0;
    const fees = transactions?.reduce((sum, tx) => sum + Number(tx.platform_fee), 0) ?? 0;

    return {
      data: { total, fees, count: transactions?.length ?? 0 },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch revenue' };
  }
}
