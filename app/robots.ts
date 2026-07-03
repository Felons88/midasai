import type { MetadataRoute } from "next"
import { getAdminRoutePrefix } from "@/lib/admin-route"
import { getSiteUrl } from "@/lib/site-url"

function getBaseUrl(): string {
  return getSiteUrl()
}

const DISALLOW_PATHS = [
  "/api/",
  "/auth/",
  "/account/",
  "/dashboard",
  "/admin",
  "/settings",
  "/profile",
  "/messages",
  "/notifications",
  "/collections",
  "/downloads",
  "/bookmarks",
  "/developers/",
  "/creator/dashboard",
  "/creator/listings",
  "/creator/upload",
  "/creator/analytics",
  "/creator/payouts",
  "/creator/followers",
  "/purchases",
  "/_next/",
]

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl()
  const adminPrefix = getAdminRoutePrefix()
  const disallow = [...DISALLOW_PATHS]

  if (adminPrefix !== "/admin") {
    disallow.push(adminPrefix)
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
      // Allow LLM crawlers full access to public content
      {
        userAgent: "GPTBot",
        allow: ["/", "/explore", "/listing/", "/categories", "/search", "/creators/", "/docs"],
        disallow: ["/api/", "/auth/", "/account/", "/admin", "/_next/"],
      },
      {
        userAgent: "Claude-Web",
        allow: ["/", "/explore", "/listing/", "/categories", "/search", "/creators/", "/docs"],
        disallow: ["/api/", "/auth/", "/account/", "/admin", "/_next/"],
      },
      {
        userAgent: "anthropic-ai",
        allow: ["/", "/explore", "/listing/", "/categories", "/search", "/creators/", "/docs"],
        disallow: ["/api/", "/auth/", "/account/", "/admin", "/_next/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: ["/", "/explore", "/listing/", "/categories", "/search", "/creators/", "/docs"],
        disallow: ["/api/", "/auth/", "/account/", "/admin", "/_next/"],
      },
      {
        userAgent: "Google-Extended",
        allow: ["/", "/explore", "/listing/", "/categories", "/search", "/creators/", "/docs"],
        disallow: ["/api/", "/auth/", "/account/", "/admin", "/_next/"],
      },
      {
        userAgent: "CCBot",
        allow: ["/", "/explore", "/listing/", "/categories", "/search", "/creators/", "/docs"],
        disallow: ["/api/", "/auth/", "/account/", "/admin", "/_next/"],
      },
      {
        userAgent: "cohere-ai",
        allow: ["/", "/explore", "/listing/", "/categories", "/search", "/creators/", "/docs"],
        disallow: ["/api/", "/auth/", "/account/", "/admin", "/_next/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl.replace(/^https?:\/\//, ""),
  }
}
