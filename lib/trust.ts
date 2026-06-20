export interface TrustBadge {
  id: string
  name: string
  description: string
  icon: string
  criteria: string[]
}

export interface CreatorTrust {
  verified: boolean
  topCreator: boolean
  rating: number
  totalListings: number
  totalDownloads: number
  totalRevenue: number
  badges: TrustBadge[]
}

export interface AssetTrust {
  verified: boolean
  qualityScore: number
  downloads: number
  reviews: number
  averageRating: number
  badges: TrustBadge[]
}

export const TRUST_BADGES: TrustBadge[] = [
  {
    id: 'verified-creator',
    name: 'Verified Creator',
    description: 'Identity verified by MidasAI',
    icon: '✓',
    criteria: [
      'Email verified',
      'Phone verified',
      'Government ID verified',
      'Payment method verified',
    ],
  },
  {
    id: 'top-creator',
    name: 'Top Creator',
    description: 'Top 10% of creators by revenue',
    icon: '★',
    criteria: [
      'Minimum $10,000 in revenue',
      'Minimum 1000 downloads',
      'Active for 6+ months',
      '4.5+ average rating',
    ],
  },
  {
    id: 'quality-badge',
    name: 'Quality Assured',
    description: 'Meets high quality standards',
    icon: '◆',
    criteria: [
      'Quality score 80+',
      'Documentation complete',
      'Tests passing',
      'No critical issues',
    ],
  },
  {
    id: 'verified-asset',
    name: 'Verified Asset',
    description: 'Code reviewed and verified',
    icon: '✓',
    criteria: [
      'Security audit passed',
      'Code review completed',
      'No known vulnerabilities',
      'Best practices followed',
    ],
  },
  {
    id: 'popular',
    name: 'Popular',
    description: 'Highly downloaded asset',
    icon: '🔥',
    criteria: [
      '1000+ downloads',
      '4.0+ average rating',
      'Active maintenance',
    ],
  },
  {
    id: 'new',
    name: 'New',
    description: 'Recently published',
    icon: '✨',
    criteria: [
      'Published within 30 days',
      'Meets quality standards',
    ],
  },
]

export function calculateCreatorTrust(
  creator: {
    verified: boolean
    totalListings: number
    totalDownloads: number
    totalRevenue: number
    averageRating: number
    createdAt: string
  }
): CreatorTrust {
  const badges: TrustBadge[] = []

  // Verified creator badge
  if (creator.verified) {
    badges.push(TRUST_BADGES.find(b => b.id === 'verified-creator')!)
  }

  // Top creator badge
  const isTopCreator =
    creator.totalRevenue >= 10000 &&
    creator.totalDownloads >= 1000 &&
    creator.averageRating >= 4.5 &&
    isOlderThanMonths(creator.createdAt, 6)

  if (isTopCreator) {
    badges.push(TRUST_BADGES.find(b => b.id === 'top-creator')!)
  }

  return {
    verified: creator.verified,
    topCreator: isTopCreator,
    rating: creator.averageRating,
    totalListings: creator.totalListings,
    totalDownloads: creator.totalDownloads,
    totalRevenue: creator.totalRevenue,
    badges,
  }
}

export function calculateAssetTrust(
  asset: {
    qualityScore: number
    downloads: number
    reviews: number
    averageRating: number
    verified: boolean
    createdAt: string
  }
): AssetTrust {
  const badges: TrustBadge[] = []

  // Quality badge
  if (asset.qualityScore >= 80) {
    badges.push(TRUST_BADGES.find(b => b.id === 'quality-badge')!)
  }

  // Verified asset badge
  if (asset.verified) {
    badges.push(TRUST_BADGES.find(b => b.id === 'verified-asset')!)
  }

  // Popular badge
  if (asset.downloads >= 1000 && asset.averageRating >= 4.0) {
    badges.push(TRUST_BADGES.find(b => b.id === 'popular')!)
  }

  // New badge
  if (isNewerThanDays(asset.createdAt, 30)) {
    badges.push(TRUST_BADGES.find(b => b.id === 'new')!)
  }

  return {
    verified: asset.verified,
    qualityScore: asset.qualityScore,
    downloads: asset.downloads,
    reviews: asset.reviews,
    averageRating: asset.averageRating,
    badges,
  }
}

export function getTopCreators(
  creators: Array<{ totalRevenue: number; totalDownloads: number; averageRating: number }>
): string[] {
  const sorted = [...creators].sort((a, b) => b.totalRevenue - a.totalRevenue)
  const top10Percent = Math.max(1, Math.floor(sorted.length * 0.1))
  return sorted.slice(0, top10Percent).map(c => c.totalRevenue.toString())
}

function isOlderThanMonths(dateString: string, months: number): boolean {
  const date = new Date(dateString)
  const now = new Date()
  const monthsDiff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth())
  return monthsDiff >= months
}

function isNewerThanDays(dateString: string, days: number): boolean {
  const date = new Date(dateString)
  const now = new Date()
  const daysDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  return daysDiff <= days
}

export function shouldVerifyCreator(creator: {
  emailVerified: boolean
  phoneVerified: boolean
  idVerified: boolean
  paymentVerified: boolean
}): boolean {
  return (
    creator.emailVerified &&
    creator.phoneVerified &&
    creator.idVerified &&
    creator.paymentVerified
  )
}

export function shouldVerifyAsset(asset: {
  securityAuditPassed: boolean
  codeReviewCompleted: boolean
  noKnownVulnerabilities: boolean
  bestPracticesFollowed: boolean
}): boolean {
  return (
    asset.securityAuditPassed &&
    asset.codeReviewCompleted &&
    asset.noKnownVulnerabilities &&
    asset.bestPracticesFollowed
  )
}
