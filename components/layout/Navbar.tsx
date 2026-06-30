"use client"

import Link from "next/link"
import { Search, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"

export function Navbar() {
  const pathname = usePathname()

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
              <Link href="/explore" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-smooth">
                Explore
              </Link>
              <Link href="/categories" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-smooth">
                Categories
              </Link>
              <Link href="/architect" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-smooth">
                Architect
              </Link>
              <Link href="/api-docs" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-smooth">
                API Docs
              </Link>
            </div>
          </div>

          {/* CENTER: Global Search */}
          <div className="flex-1 max-w-md mx-8">
            <form action="/search" method="GET" className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <input
                type="search"
                name="q"
                placeholder="Search marketplace..."
                className="h-10 w-full rounded-lg border border-white/10 bg-surface text-text-primary placeholder:text-text-tertiary pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta transition-smooth"
                aria-label="Search marketplace"
              />
            </form>
          </div>

          {/* RIGHT: Auth Actions */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="text-text-secondary hover:text-text-primary transition-smooth">
              <Link href="/auth/login">Login</Link>
            </Button>

            <Button asChild className="shadow-glow">
              <Link href="/auth/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
