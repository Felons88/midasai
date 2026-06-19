export type ListingType = 'SKILL' | 'PLUGIN' | 'MCP' | 'AGENT' | 'PROMPT' | 'WORKFLOW' | 'TEMPLATE'

export type SortOption = 'relevance' | 'trending' | 'newest' | 'popular' | 'rating' | 'downloads' | 'price_asc' | 'price_desc'

export interface SearchFilters {
  query?: string
  type?: ListingType | ListingType[]
  category?: string
  tags?: string[]
  creator?: string
  platform?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  sort?: SortOption
  page?: number
  limit?: number
}

export interface SearchResult {
  id: string
  title: string
  slug: string | null
  description: string
  type: ListingType
  status: string
  price: number
  views: number
  downloads: number
  average_rating: number
  review_count: number
  trending_score: number
  platform: string[] | null
  images: string[] | null
  created_at: string
  updated_at: string
  creator: {
    id: string
    name: string | null
    avatar_url: string | null
  } | null
  category: {
    id: string
    name: string
    slug: string
  } | null
  tags: {
    id: string
    name: string
    slug: string
  }[]
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  page: number
  limit: number
  totalPages: number
  query?: string
  filters: Partial<SearchFilters>
}

export interface TrendingConfig {
  downloadWeight: number
  viewWeight: number
  reviewWeight: number
  ratingMultiplier: number
  decayExponent: number
}

export const DEFAULT_TRENDING_CONFIG: TrendingConfig = {
  downloadWeight: 2.0,
  viewWeight: 1.0,
  reviewWeight: 3.0,
  ratingMultiplier: 1.0,
  decayExponent: 1.5,
}

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  SKILL: 'Claude Skills',
  PLUGIN: 'Plugins',
  MCP: 'MCP Servers',
  AGENT: 'AI Agents',
  PROMPT: 'Prompt Packs',
  WORKFLOW: 'Workflows',
  TEMPLATE: 'Templates',
}

export const PLATFORM_OPTIONS = [
  'Claude',
  'Claude Code',
  'Cursor',
  'Windsurf',
  'GitHub Copilot',
  'OpenAI',
  'Gemini',
  'Bolt',
  'Loveable',
  'OpenRouter',
  'N8N',
  'Make',
] as const

export type Platform = typeof PLATFORM_OPTIONS[number]
