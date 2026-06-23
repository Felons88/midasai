import { z } from 'zod'

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Passwords don't match",
  path: ["passwordConfirm"],
})

// Listing schemas
export const listingSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  type: z.enum(['SKILL', 'WORKFLOW', 'TEMPLATE', 'PLUGIN']),
  price: z.number()
    .min(0, 'Price must be non-negative')
    .max(10000, 'Price must be less than $10,000'),
  tags: z.array(z.string())
    .min(1, 'At least one tag is required')
    .max(10, 'Maximum 10 tags allowed'),
  category_id: z.string().uuid().optional(),
})

export const listingUpdateSchema = listingSchema.partial()

// API Key schemas
export const apiKeySchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  permissions: z.array(z.string()).optional(),
  rate_limit: z.number().min(1).max(10000).optional(),
  allowed_ips: z.array(z.string().ip()).optional(),
  allowed_domains: z.array(z.string().url()).optional(),
  restriction_type: z.enum(['none', 'ip', 'domain', 'both']).optional(),
})

// Webhook schemas
export const webhookSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  url: z.string().url('Invalid webhook URL'),
  events: z.array(z.string()).min(1, 'At least one event is required'),
  secret: z.string().min(16, 'Secret must be at least 16 characters').optional(),
})

// Application schemas
export const applicationSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  website: z.string().url('Invalid website URL'),
  callback_url: z.string().url('Invalid callback URL'),
  scopes: z.array(z.string()).min(1, 'At least one scope is required'),
})

// MCP Server schemas
export const mcpServerSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  url: z.string().url('Invalid server URL'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
})

// Review schemas
export const reviewSchema = z.object({
  listing_id: z.string().uuid('Invalid listing ID'),
  rating: z.number()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  // `title` is optional and not persisted (the reviews table only stores `comment`).
  title: z.string().max(100, 'Title must be less than 100 characters').optional(),
  content: z.string()
    .min(10, 'Review must be at least 10 characters')
    .max(2000, 'Review must be less than 2000 characters'),
})

// GitHub schemas
export const githubAuthSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().min(1, 'State is required'),
})

export const githubRepoSchema = z.object({
  repoFullName: z.string()
    .min(1, 'Repository name is required')
    .regex(/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/, 'Invalid repository format'),
})

// Stripe schemas
export const stripeCheckoutSchema = z.object({
  tier: z.enum(['FREE', 'STARTER', 'PRO', 'BUSINESS']),
  interval: z.enum(['monthly', 'yearly']).optional(),
})

export const stripeListingCheckoutSchema = z.object({
  listingId: z.string().uuid('Invalid listing ID'),
  listingTitle: z.string().min(1, 'Listing title is required'),
  listingPrice: z.number().min(0, 'Price must be non-negative'),
  creatorId: z.string().uuid('Invalid creator ID'),
})

// Generic pagination schema
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
})

// Search schema
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100),
  type: z.enum(['SKILL', 'WORKFLOW', 'TEMPLATE', 'PLUGIN']).optional(),
  category: z.string().uuid().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
})

// Helper function to validate request body
export async function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): Promise<T> {
  try {
    return await schema.parseAsync(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }))
      throw new Error(JSON.stringify(formattedErrors))
    }
    throw error
  }
}

// Helper function to validate query params
export async function validateQuery<T>(schema: z.ZodSchema<T>, query: unknown): Promise<T> {
  try {
    return await schema.parseAsync(query)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }))
      throw new Error(JSON.stringify(formattedErrors))
    }
    throw error
  }
}
