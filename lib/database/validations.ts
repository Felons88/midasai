import { z } from 'zod';

// =============================================================================
// MidasAI Validation Schemas
// =============================================================================
// Zod schemas for all database operations.
// Used for input validation in server actions and API routes.
// =============================================================================

// -----------------------------------------------------------------------------
// Enum Schemas
// -----------------------------------------------------------------------------

export const UserRoleSchema = z.enum(['user', 'creator', 'moderator', 'admin', 'owner']);

export const ListingTypeSchema = z.enum([
  'claude_skill',
  'claude_code_skill',
  'cursor_rule',
  'windsurf_workflow',
  'mcp_server',
  'ai_agent',
  'prompt_pack',
  'template',
  'automation',
]);

export const ListingStatusSchema = z.enum([
  'draft',
  'pending_review',
  'published',
  'rejected',
  'suspended',
  'archived',
]);

export const TransactionStatusSchema = z.enum([
  'pending',
  'completed',
  'failed',
  'refunded',
  'disputed',
]);

export const TransactionTypeSchema = z.enum([
  'purchase',
  'subscription',
  'payout',
  'refund',
  'fee',
]);

export const PricingModelSchema = z.enum([
  'free',
  'one_time',
  'subscription',
  'pay_what_you_want',
]);

export const PlatformSchema = z.enum([
  'claude',
  'claude_code',
  'cursor',
  'windsurf',
  'github_copilot',
  'bolt',
  'loveable',
  'openai',
  'gemini',
  'openrouter',
  'n8n',
  'make',
  'universal',
]);

export const NotificationTypeSchema = z.enum([
  'review',
  'download',
  'purchase',
  'follow',
  'listing_approved',
  'listing_rejected',
  'payout',
  'system',
]);

// -----------------------------------------------------------------------------
// Shared Validators
// -----------------------------------------------------------------------------

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const SlugSchema = z
  .string()
  .min(2, 'Slug must be at least 2 characters')
  .max(128, 'Slug must be at most 128 characters')
  .regex(slugRegex, 'Slug must be lowercase alphanumeric with hyphens');

const UuidSchema = z.string().uuid('Invalid UUID');

const UrlSchema = z.string().url('Invalid URL').max(2048).optional().or(z.literal(''));

// -----------------------------------------------------------------------------
// Profile Schemas
// -----------------------------------------------------------------------------

export const UpdateProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(32, 'Username must be at most 32 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores')
    .optional(),
  display_name: z.string().min(1).max(64).optional(),
  bio: z.string().max(500).optional(),
  avatar_url: UrlSchema,
  website: UrlSchema,
  github_url: UrlSchema,
  twitter_url: UrlSchema,
});

export const CreateCreatorProfileSchema = z.object({
  company_name: z.string().max(100).optional(),
  tagline: z.string().max(160).optional(),
  long_description: z.string().max(5000).optional(),
  specializations: z.array(z.string().max(50)).max(10).optional(),
  payout_email: z.string().email('Invalid email').optional(),
});

export const UpdateCreatorProfileSchema = CreateCreatorProfileSchema.partial();

// -----------------------------------------------------------------------------
// Listing Schemas
// -----------------------------------------------------------------------------

export const CreateListingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(120, 'Title must be at most 120 characters'),
  slug: SlugSchema,
  short_description: z.string().min(10, 'Description must be at least 10 characters').max(300, 'Description must be at most 300 characters'),
  long_description: z.string().max(50000).optional(),
  type: ListingTypeSchema,
  pricing_model: PricingModelSchema.default('free'),
  price: z.number().min(0).max(9999.99).default(0),
  platforms: z.array(PlatformSchema).min(1, 'Select at least one platform'),
  category_id: UuidSchema.optional(),
  version: z.string().max(20).optional(),
  license: z.string().max(50).optional(),
  repository_url: UrlSchema,
  documentation_url: UrlSchema,
  demo_url: UrlSchema,
  thumbnail_url: UrlSchema,
  images: z.array(z.string().url()).max(10).optional(),
  content: z.record(z.unknown()).optional(),
  installation_instructions: z.string().max(10000).optional(),
  tag_ids: z.array(UuidSchema).max(10).optional(),
  meta_title: z.string().max(70).optional(),
  meta_description: z.string().max(160).optional(),
});

export const UpdateListingSchema = CreateListingSchema.partial();

export const PublishListingSchema = z.object({
  listing_id: UuidSchema,
});

// -----------------------------------------------------------------------------
// Review Schemas
// -----------------------------------------------------------------------------

export const CreateReviewSchema = z.object({
  listing_id: UuidSchema,
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  title: z.string().min(3).max(120).optional(),
  body: z.string().min(10, 'Review must be at least 10 characters').max(5000).optional(),
});

export const UpdateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().min(3).max(120).optional(),
  body: z.string().min(10).max(5000).optional(),
});

// -----------------------------------------------------------------------------
// Collection Schemas
// -----------------------------------------------------------------------------

export const CreateCollectionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(64, 'Name must be at most 64 characters'),
  slug: SlugSchema,
  description: z.string().max(500).optional(),
  is_public: z.boolean().default(true),
});

export const UpdateCollectionSchema = CreateCollectionSchema.partial();

export const AddToCollectionSchema = z.object({
  collection_id: UuidSchema,
  listing_id: UuidSchema,
  sort_order: z.number().int().min(0).optional(),
});

// -----------------------------------------------------------------------------
// Bookmark Schemas
// -----------------------------------------------------------------------------

export const ToggleBookmarkSchema = z.object({
  listing_id: UuidSchema,
});

// -----------------------------------------------------------------------------
// Download Schemas
// -----------------------------------------------------------------------------

export const RecordDownloadSchema = z.object({
  listing_id: UuidSchema,
  version: z.string().max(20).optional(),
});

// -----------------------------------------------------------------------------
// Transaction Schemas
// -----------------------------------------------------------------------------

export const CreatePurchaseSchema = z.object({
  listing_id: UuidSchema,
  payment_method_id: z.string().optional(),
});

// -----------------------------------------------------------------------------
// Follow Schemas
// -----------------------------------------------------------------------------

export const ToggleFollowSchema = z.object({
  user_id: UuidSchema,
});

// -----------------------------------------------------------------------------
// Search & Filter Schemas
// -----------------------------------------------------------------------------

export const ListingSearchSchema = z.object({
  query: z.string().max(200).optional(),
  type: ListingTypeSchema.optional(),
  category_id: UuidSchema.optional(),
  platforms: z.array(PlatformSchema).optional(),
  pricing_model: PricingModelSchema.optional(),
  min_rating: z.number().min(0).max(5).optional(),
  tags: z.array(z.string()).optional(),
  creator_id: UuidSchema.optional(),
  sort_by: z.enum(['newest', 'popular', 'downloads', 'rating', 'price_asc', 'price_desc']).default('newest'),
  page: z.number().int().min(1).default(1),
  per_page: z.number().int().min(1).max(100).default(24),
});

// -----------------------------------------------------------------------------
// Admin Schemas
// -----------------------------------------------------------------------------

export const UpdateUserRoleSchema = z.object({
  user_id: UuidSchema,
  role: UserRoleSchema,
});

export const ModerateListingSchema = z.object({
  listing_id: UuidSchema,
  action: z.enum(['approve', 'reject', 'suspend']),
  reason: z.string().max(500).optional(),
});

// -----------------------------------------------------------------------------
// Notification Schemas
// -----------------------------------------------------------------------------

export const MarkNotificationsReadSchema = z.object({
  notification_ids: z.array(UuidSchema).min(1).max(100),
});

// -----------------------------------------------------------------------------
// Type Exports (inferred from schemas)
// -----------------------------------------------------------------------------

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type CreateCreatorProfileInput = z.infer<typeof CreateCreatorProfileSchema>;
export type UpdateCreatorProfileInput = z.infer<typeof UpdateCreatorProfileSchema>;
export type CreateListingInput = z.infer<typeof CreateListingSchema>;
export type UpdateListingInput = z.infer<typeof UpdateListingSchema>;
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type UpdateReviewInput = z.infer<typeof UpdateReviewSchema>;
export type CreateCollectionInput = z.infer<typeof CreateCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof UpdateCollectionSchema>;
export type AddToCollectionInput = z.infer<typeof AddToCollectionSchema>;
export type ToggleBookmarkInput = z.infer<typeof ToggleBookmarkSchema>;
export type RecordDownloadInput = z.infer<typeof RecordDownloadSchema>;
export type CreatePurchaseInput = z.infer<typeof CreatePurchaseSchema>;
export type ToggleFollowInput = z.infer<typeof ToggleFollowSchema>;
export type ListingSearchInput = z.infer<typeof ListingSearchSchema>;
export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleSchema>;
export type ModerateListingInput = z.infer<typeof ModerateListingSchema>;
export type MarkNotificationsReadInput = z.infer<typeof MarkNotificationsReadSchema>;
