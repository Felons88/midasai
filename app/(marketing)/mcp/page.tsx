import Link from "next/link"
import { Suspense } from "react"
import { ExternalLink, Server } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MCP_PROVIDER_CATALOG } from "@/lib/mcp/public-catalog"
import {
  fetchPaginatedListings,
} from "@/lib/marketplace/paginated-listings"
import { parseMarketplacePagination } from "@/lib/marketplace/pagination"
import { MarketplaceListingGrid } from "@/components/marketplace/MarketplaceListingGrid"

type McpPageProps = {
  searchParams?: Promise<{ page?: string; limit?: string }>
}

export default async function MCPPage({ searchParams }: McpPageProps) {
  const params = await searchParams
  const { page, limit } = parseMarketplacePagination(params, 50)
  const { listings, total } = await fetchPaginatedListings({
    type: "MCP",
    page,
    limit,
  })

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="ambient-glow" />
      <div className="noise-overlay" />

      <div className="container mx-auto px-4 py-12 relative">
        <div className="mb-12 animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-text-primary">MCP Marketplace</h1>
          <p className="text-xl text-text-secondary max-w-3xl">
            Connect your AI agents to Model Context Protocol servers from major platforms and
            community-built integrations on MidasAI.
          </p>
        </div>

        <section className="mb-16 animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">Major MCP providers</h2>
              <p className="text-sm text-text-tertiary mt-1">
                Official and first-party MCP connections from leading companies
              </p>
            </div>
            <Badge variant="outline" className="border-cta/30 text-cta">
              {MCP_PROVIDER_CATALOG.length} providers
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {MCP_PROVIDER_CATALOG.map((provider, index) => (
              <Card
                key={provider.id}
                className="glass hover:shadow-glow transition-smooth h-full"
                style={{ animationDelay: `${(index % 8) * 0.04}s` }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cta/10 border border-cta/20">
                      <Server className="h-5 w-5 text-cta" />
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                      {provider.transport}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg text-text-primary pt-2">{provider.name}</CardTitle>
                  <p className="text-xs text-text-tertiary">{provider.company}</p>
                  <CardDescription className="text-sm text-text-secondary line-clamp-3 min-h-[3.75rem]">
                    {provider.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-2 pt-0">
                  <Badge variant="outline" className="text-text-tertiary">
                    {provider.category}
                  </Badge>
                  <Button size="sm" variant="outline" className="border-white/10" asChild>
                    <a href={provider.docsUrl} target="_blank" rel="noreferrer">
                      Docs
                      <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary">Community MCP servers</h2>
            <p className="text-sm text-text-tertiary mt-1">
              MCP listings published by creators on MidasAI
            </p>
          </div>

          <Suspense
            fallback={
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: limit }).map((_, i) => (
                  <div
                    key={i}
                    className="h-72 rounded-xl border border-white/[0.06] bg-white/[0.02] animate-pulse"
                  />
                ))}
              </div>
            }
          >
            <MarketplaceListingGrid
              listings={listings}
              total={total}
              page={page}
              limit={limit}
              basePath="/mcp"
              emptyMessage="No community MCP servers yet. Be the first to publish one."
            />
          </Suspense>

          <div className="mt-10 text-center">
            <Button variant="outline" className="border-white/10" asChild>
              <Link href="/developer/mcp">Publish your MCP server</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
