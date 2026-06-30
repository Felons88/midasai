export const MARKETPLACE_PAGE_SIZES = [10, 50, 100] as const
export type MarketplacePageSize = (typeof MARKETPLACE_PAGE_SIZES)[number]

export function parseMarketplacePagination(
  searchParams?: { page?: string; limit?: string },
  defaultLimit: MarketplacePageSize = 50
) {
  const page = Math.max(1, Number.parseInt(searchParams?.page ?? "1", 10) || 1)
  const rawLimit = Number.parseInt(searchParams?.limit ?? String(defaultLimit), 10)
  const limit: MarketplacePageSize = MARKETPLACE_PAGE_SIZES.includes(
    rawLimit as MarketplacePageSize
  )
    ? (rawLimit as MarketplacePageSize)
    : defaultLimit
  return { page, limit, offset: (page - 1) * limit }
}
