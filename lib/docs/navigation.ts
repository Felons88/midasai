import type { LucideIcon } from "lucide-react"
import {
  BookOpen,
  Key,
  Webhook,
  Zap,
  List,
  Users,
  BarChart3,
  Package,
  AlertCircle,
  Gauge,
} from "lucide-react"

export type DocsNavItem = {
  title: string
  href: string
  icon?: LucideIcon
  description?: string
}

export type DocsNavSection = {
  title: string
  items: DocsNavItem[]
}

export const DOCS_NAV: DocsNavSection[] = [
  {
    title: "Getting started",
    items: [
      { title: "Introduction", href: "/api-docs", icon: BookOpen, description: "Overview of the MidasAI API" },
      { title: "Quickstart", href: "/api-docs/getting-started", icon: Zap, description: "Make your first API call" },
      { title: "Authentication", href: "/api-docs/authentication", icon: Key, description: "API keys and security" },
      { title: "Rate limits", href: "/api-docs/rate-limits", icon: Gauge, description: "Quotas and headers" },
      { title: "Errors", href: "/api-docs/errors", icon: AlertCircle, description: "Error codes and handling" },
    ],
  },
  {
    title: "API reference",
    items: [
      { title: "Listings", href: "/api-docs/reference#listings", icon: List },
      { title: "Users", href: "/api-docs/reference#users", icon: Users },
      { title: "Analytics", href: "/api-docs/reference#analytics", icon: BarChart3 },
      { title: "Webhooks", href: "/api-docs/reference#webhooks", icon: Webhook },
      { title: "Full reference", href: "/api-docs/reference", icon: BookOpen },
    ],
  },
  {
    title: "Guides",
    items: [
      { title: "Webhooks guide", href: "/api-docs/webhooks", icon: Webhook },
      { title: "MCP integration", href: "/api-docs/mcp", icon: Package },
      { title: "SDKs & tools", href: "/api-docs/sdks", icon: Package },
    ],
  },
]

export const API_ENDPOINTS = [
  {
    id: "listings",
    category: "Listings",
    routes: [
      { method: "GET", path: "/v1/listings", description: "List active marketplace listings", auth: "read" },
      { method: "GET", path: "/v1/listings/:id", description: "Get a single listing", auth: "read" },
      { method: "POST", path: "/v1/listings", description: "Create a listing (creator)", auth: "write" },
      { method: "PUT", path: "/v1/listings/:id", description: "Update your listing", auth: "write" },
      { method: "DELETE", path: "/v1/listings/:id", description: "Archive your listing", auth: "delete" },
    ],
  },
  {
    id: "users",
    category: "Users",
    routes: [
      { method: "GET", path: "/v1/users/me", description: "Current authenticated user", auth: "read" },
      { method: "PUT", path: "/v1/users/me", description: "Update your profile", auth: "write" },
      { method: "GET", path: "/v1/users/:id", description: "Public user profile", auth: "read" },
    ],
  },
  {
    id: "analytics",
    category: "Analytics",
    routes: [
      { method: "GET", path: "/v1/analytics/usage", description: "API usage for your key", auth: "read" },
      { method: "GET", path: "/v1/analytics/listings", description: "Listing performance stats", auth: "read" },
    ],
  },
  {
    id: "webhooks",
    category: "Webhooks",
    routes: [
      { method: "GET", path: "/v1/webhooks", description: "List webhooks", auth: "read" },
      { method: "POST", path: "/v1/webhooks", description: "Register a webhook endpoint", auth: "write" },
      { method: "DELETE", path: "/v1/webhooks/:id", description: "Remove a webhook", auth: "delete" },
    ],
  },
] as const

/** Ordered doc pages for prev/next footer navigation (full pages only). */
export const DOCS_PAGE_SEQUENCE: DocsNavItem[] = [
  { title: "Introduction", href: "/api-docs", description: "API overview" },
  { title: "Quickstart", href: "/api-docs/getting-started", description: "First API call" },
  { title: "Authentication", href: "/api-docs/authentication", description: "API keys" },
  { title: "Rate limits", href: "/api-docs/rate-limits", description: "Quotas & headers" },
  { title: "Errors", href: "/api-docs/errors", description: "Status codes" },
  { title: "API reference", href: "/api-docs/reference", description: "All endpoints" },
  { title: "Webhooks", href: "/api-docs/webhooks", description: "Event delivery" },
  { title: "MCP integration", href: "/api-docs/mcp", description: "Model Context Protocol" },
  { title: "SDKs & tools", href: "/api-docs/sdks", description: "Client libraries" },
]

export function getDocsAdjacentPages(pathname: string) {
  const path = pathname.split("#")[0] || "/api-docs"
  const index = DOCS_PAGE_SEQUENCE.findIndex((page) => page.href === path)
  if (index === -1) {
    return { previous: null, next: null }
  }
  return {
    previous: index > 0 ? DOCS_PAGE_SEQUENCE[index - 1] : null,
    next: index < DOCS_PAGE_SEQUENCE.length - 1 ? DOCS_PAGE_SEQUENCE[index + 1] : null,
  }
}
