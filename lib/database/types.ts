// =============================================================================
// MidasAI Database Types
// =============================================================================
// TypeScript types mirroring the Supabase schema.
// These are used throughout the application for type safety.
// =============================================================================

// -----------------------------------------------------------------------------
// Enums
// -----------------------------------------------------------------------------

export type UserRole = 'user' | 'creator' | 'moderator' | 'admin' | 'owner';

export type ListingType =
  | 'claude_skill'
  | 'claude_code_skill'
  | 'cursor_rule'
  | 'windsurf_workflow'
  | 'mcp_server'
  | 'ai_agent'
  | 'prompt_pack'
  | 'template'
  | 'automation';

export type ListingStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'rejected'
  | 'suspended'
  | 'archived';

export type TransactionStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'disputed';

export type TransactionType =
  | 'purchase'
  | 'subscription'
  | 'payout'
  | 'refund'
  | 'fee';

export type PricingModel =
  | 'free'
  | 'one_time'
  | 'subscription'
  | 'pay_what_you_want';

export type Platform =
  | 'claude'
  | 'claude_code'
  | 'cursor'
  | 'windsurf'
  | 'github_copilot'
  | 'bolt'
  | 'loveable'
  | 'openai'
  | 'gemini'
  | 'openrouter'
  | 'n8n'
  | 'make'
  | 'universal';

export type NotificationType =
  | 'review'
  | 'download'
  | 'purchase'
  | 'follow'
  | 'listing_approved'
  | 'listing_rejected'
  | 'payout'
  | 'system';

// -----------------------------------------------------------------------------
// Core Tables
// -----------------------------------------------------------------------------

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
  github_url: string | null;
  twitter_url: string | null;
  role: UserRole;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatorProfile {
  id: string;
  user_id: string;
  company_name: string | null;
  tagline: string | null;
  long_description: string | null;
  specializations: string[];
  total_downloads: number;
  total_earnings: number;
  payout_email: string | null;
  stripe_account_id: string | null;
  is_featured: boolean;
  follower_count: number;
  created_at: string;
  updated_at: string;
}

// -----------------------------------------------------------------------------
// Marketplace Tables
// -----------------------------------------------------------------------------

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  parent_id: string | null;
  sort_order: number;
  listing_count: number;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  usage_count: number;
  created_at: string;
}

export interface Listing {
  id: string;
  creator_id: string;
  category_id: string | null;
  title: string;
  slug: string;
  short_description: string;
  long_description: string | null;
  type: ListingType;
  status: ListingStatus;
  pricing_model: PricingModel;
  price: number;
  platforms: Platform[];
  version: string | null;
  license: string | null;
  repository_url: string | null;
  documentation_url: string | null;
  demo_url: string | null;
  thumbnail_url: string | null;
  images: string[];
  content: Record<string, unknown> | null;
  installation_instructions: string | null;
  view_count: number;
  download_count: number;
  bookmark_count: number;
  review_count: number;
  average_rating: number;
  meta_title: string | null;
  meta_description: string | null;
  is_featured: boolean;
  is_verified: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListingVersion {
  id: string;
  listing_id: string;
  version: string;
  changelog: string | null;
  content: Record<string, unknown> | null;
  created_at: string;
}

// -----------------------------------------------------------------------------
// Interactions
// -----------------------------------------------------------------------------

export interface Review {
  id: string;
  listing_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_public: boolean;
  listing_count: number;
  created_at: string;
  updated_at: string;
}

export interface CollectionItem {
  collection_id: string;
  listing_id: string;
  sort_order: number;
  added_at: string;
}

export interface Download {
  id: string;
  listing_id: string;
  user_id: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  version: string | null;
  created_at: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

// -----------------------------------------------------------------------------
// Transactions
// -----------------------------------------------------------------------------

export interface Transaction {
  id: string;
  buyer_id: string | null;
  seller_id: string | null;
  listing_id: string | null;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  platform_fee: number;
  net_amount: number;
  currency: string;
  stripe_payment_id: string | null;
  stripe_transfer_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  completed_at: string | null;
}

export interface Purchase {
  id: string;
  user_id: string;
  listing_id: string;
  transaction_id: string | null;
  created_at: string;
}

// -----------------------------------------------------------------------------
// Notifications
// -----------------------------------------------------------------------------

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

// -----------------------------------------------------------------------------
// Platform
// -----------------------------------------------------------------------------

export interface SiteSetting {
  id: string;
  key: string;
  value: unknown;
  updated_at: string;
}

// -----------------------------------------------------------------------------
// Joined / View Types (commonly used in queries)
// -----------------------------------------------------------------------------

export interface ListingWithCreator extends Listing {
  creator: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'is_verified'>;
}

export interface ListingWithDetails extends ListingWithCreator {
  category: Pick<Category, 'id' | 'name' | 'slug'> | null;
  tags: Pick<Tag, 'id' | 'name' | 'slug'>[];
}

export interface ReviewWithUser extends Review {
  user: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>;
}

export interface CreatorWithProfile extends CreatorProfile {
  profile: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'is_verified'>;
}

export interface CollectionWithItems extends Collection {
  items: (CollectionItem & { listing: ListingWithCreator })[];
}
