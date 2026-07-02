"use client"

import Link from "next/link"
import { Search, Sparkles, Menu, X, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/categories", label: "Categories" },
  { href: "/architect", label: "Architect" },
  { href: "/creators", label: "Creators" },
  { href: "/pricing", label: "Pricing" },
]

export function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

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
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm font-medium transition-smooth",
                    pathname === link.href
                      ? "text-text-primary"
                      : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* CENTER: Global Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form action="/search" method="GET" className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <input
                type="search"
                name="q"
                placeholder="Search skills, agents, workflows..."
                className="h-10 w-full rounded-lg border border-white/10 bg-surface text-text-primary placeholder:text-text-tertiary pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta transition-smooth"
                aria-label="Search marketplace"
              />
            </form>
          </div>

          {/* RIGHT: Auth Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" asChild className="text-text-secondary hover:text-text-primary transition-smooth">
              <Link href="/auth/login">Login</Link>
            </Button>

            <Button variant="ghost" asChild className="text-text-secondary hover:text-text-primary transition-smooth">
              <Link href="/creator/upload">
                <Upload className="h-4 w-4 mr-1.5" />
                Upload
              </Link>
            </Button>

            <Button asChild className="shadow-glow">
              <Link href="/auth/register">Get Started</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 text-text-secondary hover:text-text-primary transition-smooth"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/5 bg-background/95 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <form action="/search" method="GET" className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <input
                type="search"
                name="q"
                placeholder="Search skills, agents, workflows..."
                className="h-11 w-full rounded-lg border border-white/10 bg-surface text-text-primary placeholder:text-text-tertiary pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta transition-smooth"
                aria-label="Search marketplace"
              />
            </form>
            <div className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth",
                    pathname === link.href
                      ? "bg-white/5 text-text-primary"
                      : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
              <Link
                href="/auth/login"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary transition-smooth"
              >
                Login
              </Link>
              <Link
                href="/creator/upload"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary transition-smooth"
              >
                Upload
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium bg-cta text-primary-foreground hover:bg-cta-light transition-smooth"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
