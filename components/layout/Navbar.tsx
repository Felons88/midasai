"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, Search, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"

export function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const marketplaceLinks = [
    { href: "/explore", label: "Explore" },
    { href: "/categories", label: "Categories" },
    { href: "/skills", label: "Skills" },
    { href: "/workflows", label: "Workflows" },
    { href: "/mcp", label: "MCP Servers" },
    { href: "/agents", label: "Agents" },
    { href: "/plugins", label: "Plugins" },
    { href: "/api-docs", label: "API Docs" },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* LEFT: Logo + Marketplace Links */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group cursor-pointer">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cta to-cta-light flex items-center justify-center group-hover:scale-105 transition-smooth shadow-glow">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xl font-bold text-text-primary">MidasAI</span>
            </Link>
            
            <div className="hidden lg:flex items-center gap-6">
              {marketplaceLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-text-secondary hover:text-text-primary transition-smooth"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* CENTER: Global Search */}
          <div className="mx-4 hidden max-w-md flex-1 md:block lg:mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <input
                type="search"
                placeholder="Search marketplace..."
                className="h-10 w-full rounded-lg border border-white/10 bg-surface text-text-primary placeholder:text-text-tertiary pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta transition-smooth"
              />
            </div>
          </div>

          {/* RIGHT: Auth Actions */}
          <div className="hidden items-center gap-3 sm:flex">
            <Button variant="ghost" asChild className="text-text-secondary hover:text-text-primary transition-smooth">
              <Link href="/auth/login">Login</Link>
            </Button>

            <Button asChild className="shadow-glow">
              <Link href="/auth/register">Get Started</Link>
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="ml-3 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-surface text-text-primary transition-smooth hover:bg-white/[0.08] lg:hidden"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-white/5 py-4 lg:hidden">
            <div className="relative mb-4 md:hidden">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <input
                type="search"
                placeholder="Search marketplace..."
                className="h-11 w-full rounded-lg border border-white/10 bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta"
              />
            </div>

            <div className="grid gap-1">
              {marketplaceLinks.map((link) => {
                const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-smooth ${
                      active
                        ? "bg-white/[0.08] text-text-primary"
                        : "text-text-secondary hover:bg-white/[0.05] hover:text-text-primary"
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:hidden">
              <Button variant="outline" asChild>
                <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                  Login
                </Link>
              </Button>
              <Button asChild className="shadow-glow">
                <Link href="/auth/register" onClick={() => setMobileOpen(false)}>
                  Get Started
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
