export interface PricingModel {
  type: 'FREE' | 'PAID' | 'FREEMIUM' | 'SUBSCRIPTION' | 'LIFETIME'
  price: number
  currency?: string
  subscriptionInterval?: 'monthly' | 'yearly'
  trialDays?: number
  features?: string[]
}

export interface SubscriptionTier {
  tier: 'FREE' | 'PRO' | 'ENTERPRISE'
  price: number
  interval: 'monthly' | 'yearly'
  features: string[]
  limits: {
    listings: number
    downloads: number
    apiCalls: number
  }
}

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    tier: 'FREE',
    price: 0,
    interval: 'monthly',
    features: [
      'Browse all listings',
      'Download free assets',
      'Basic search',
      'Community support',
    ],
    limits: {
      listings: 0,
      downloads: 10,
      apiCalls: 100,
    },
  },
  {
    tier: 'PRO',
    price: 29,
    interval: 'monthly',
    features: [
      'Everything in Free',
      'Unlimited downloads',
      'Advanced search',
      'Priority support',
      'Creator analytics',
      'Custom branding',
    ],
    limits: {
      listings: 10,
      downloads: -1,
      apiCalls: 1000,
    },
  },
  {
    tier: 'ENTERPRISE',
    price: 99,
    interval: 'monthly',
    features: [
      'Everything in Pro',
      'Unlimited listings',
      'White-label solution',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
      'Team collaboration',
    ],
    limits: {
      listings: -1,
      downloads: -1,
      apiCalls: -1,
    },
  },
]

export function calculatePlatformFee(amount: number, feePercentage: number = 15): {
  platformFee: number
  netAmount: number
} {
  const platformFee = amount * (feePercentage / 100)
  const netAmount = amount - platformFee
  return { platformFee, netAmount }
}

export function calculateSubscriptionRevenue(
  tier: 'FREE' | 'PRO' | 'ENTERPRISE',
  interval: 'monthly' | 'yearly'
): number {
  const tierConfig = SUBSCRIPTION_TIERS.find(t => t.tier === tier)
  if (!tierConfig) return 0

  const monthlyPrice = tierConfig.price
  return interval === 'yearly' ? monthlyPrice * 12 : monthlyPrice
}

export function canUserDownload(
  userTier: 'FREE' | 'PRO' | 'ENTERPRISE',
  downloadsThisMonth: number
): boolean {
  const tierConfig = SUBSCRIPTION_TIERS.find(t => t.tier === userTier)
  if (!tierConfig) return false

  return tierConfig.limits.downloads === -1 || downloadsThisMonth < tierConfig.limits.downloads
}

export function canUserCreateListing(
  userTier: 'FREE' | 'PRO' | 'ENTERPRISE',
  listingsCount: number
): boolean {
  const tierConfig = SUBSCRIPTION_TIERS.find(t => t.tier === userTier)
  if (!tierConfig) return false

  return tierConfig.limits.listings === -1 || listingsCount < tierConfig.limits.listings
}

export function getPricingModel(listingPrice: number): PricingModel {
  if (listingPrice === 0) {
    return {
      type: 'FREE',
      price: 0,
    }
  }

  // For now, we'll treat all paid listings as one-time purchases
  // In the future, this could be expanded to support subscriptions
  return {
    type: 'PAID',
    price: listingPrice,
    currency: 'USD',
  }
}

export function formatPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price)
}

export function getSubscriptionFeatures(tier: 'FREE' | 'PRO' | 'ENTERPRISE'): string[] {
  const tierConfig = SUBSCRIPTION_TIERS.find(t => t.tier === tier)
  return tierConfig?.features || []
}

export function isListingAccessible(
  listingPrice: number,
  userHasPurchased: boolean,
  userTier: 'FREE' | 'PRO' | 'ENTERPRISE'
): boolean {
  // Free listings are accessible to everyone
  if (listingPrice === 0) return true

  // Paid listings require purchase
  return userHasPurchased
}
