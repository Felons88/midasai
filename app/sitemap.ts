import type { MetadataRoute } from "next"
import { createPublicClient } from "@/lib/supabase/server"
import { getDocsUrl, getSiteUrl } from "@/lib/site-url"

export const revalidate = 3600

const DOCS_PAGES = [
  "",
  "/getting-started",
  "/authentication",
  "/reference",
  "/webhooks",
  "/mcp",
  "/sdks",
  "/errors",
  "/rate-limits",
]

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: "/explore", changeFrequency: "daily", priority: 1 },
  { url: "/search", changeFrequency: "daily", priority: 0.9 },
  { url: "/featured", changeFrequency: "daily", priority: 0.8 },
  { url: "/trending", changeFrequency: "daily", priority: 0.8 },
  { url: "/categories", changeFrequency: "weekly", priority: 0.7 },
  { url: "/plugins", changeFrequency: "weekly", priority: 0.7 },
  { url: "/mcp", changeFrequency: "weekly", priority: 0.7 },
  { url: "/agents", changeFrequency: "weekly", priority: 0.7 },
  { url: "/prompts", changeFrequency: "weekly", priority: 0.7 },
  { url: "/workflows", changeFrequency: "weekly", priority: 0.7 },
  { url: "/templates", changeFrequency: "weekly", priority: 0.7 },
  { url: "/about", changeFrequency: "monthly", priority: 0.5 },
  { url: "/pricing", changeFrequency: "monthly", priority: 0.5 },
  { url: "/contact", changeFrequency: "monthly", priority: 0.4 },
  { url: "/docs", changeFrequency: "weekly", priority: 0.6 },
  { url: "/docs/api", changeFrequency: "weekly", priority: 0.7 },
  { url: "/blog", changeFrequency: "weekly", priority: 0.6 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl()
  const docsUrl = getDocsUrl()

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    ...route,
    url: `${baseUrl}${route.url}`,
  }))

  const docsEntries: MetadataRoute.Sitemap = DOCS_PAGES.map((path) => ({
    url: `${docsUrl}${path === "" ? "" : path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 0.8 : 0.6,
  }))

  const apiDocsMirror: MetadataRoute.Sitemap = DOCS_PAGES.map((path) => ({
    url: `${baseUrl}/docs/api${path}`,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }))

  try {
    const supabase = createPublicClient()
    const { data: listings } = await supabase
      .from("listings")
      .select("id, updated_at")
      .eq("status", "ACTIVE")

    const listingEntries: MetadataRoute.Sitemap = (listings ?? []).map((listing) => ({
      url: `${baseUrl}/listing/${listing.id}`,
      lastModified: listing.updated_at ? new Date(listing.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }))

    return [...staticEntries, ...docsEntries, ...apiDocsMirror, ...listingEntries]
  } catch (error) {
    console.error("Error generating sitemap listings:", error)
    return [...staticEntries, ...docsEntries, ...apiDocsMirror]
  }
}
