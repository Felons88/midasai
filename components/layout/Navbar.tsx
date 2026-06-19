"use client"

import Link from "next/link"
import { useState } from "react"
import { Search, Menu, X, Sparkles, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"

const navLinks = [
  { label: "Skills", href: "/skills" },
  { label: "Plugins", href: "/plugins" },
  { label: "MCP Servers", href: "/mcp" },
  { label: "Agents", href: "/agents" },
  { label: "Workflows", href: "/workflows" },
  { label: "Templates", href: "/templates" },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)

  return (
    <>
      <nav className="fixed top-0 z-50 w-full border-b border-white/[0.06] bg-background/60 backdrop-blur-2xl">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <Sparkles className="h-4 w-4 text-background" />
                  <div className="absolute inset-0 rounded-lg bg-gold/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="text-lg font-bold tracking-tight text-foreground">
                  Midas<span className="text-gradient-gold">AI</span>
                </span>
              </Link>

              {/* Desktop Nav */}
              <div className="hidden lg:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-white/[0.04]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="hidden md:flex items-center">
                <div className={`relative transition-all duration-300 ${searchFocused ? 'w-72' : 'w-56'}`}>
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Search marketplace..."
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    className="h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/50 focus-visible:border-gold/30 transition-all"
                  />
                  <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border border-white/[0.08] bg-white/[0.03] px-1.5 text-[10px] font-medium text-muted-foreground">
                    /
                  </kbd>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                  asChild
                >
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button
                  size="sm"
                  className="bg-gold hover:bg-gold-light text-background font-medium text-sm h-9 px-4 rounded-lg glow-gold-sm"
                  asChild
                >
                  <Link href="/register">Get Started</Link>
                </Button>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-white/[0.04] text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 border-b border-white/[0.06] bg-background/95 backdrop-blur-2xl lg:hidden"
          >
            <div className="container mx-auto px-4 py-6 space-y-4">
              {/* Mobile search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search marketplace..."
                  className="h-10 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/50"
                />
              </div>

              {/* Mobile nav links */}
              <div className="space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/[0.04] transition-colors"
                  >
                    {link.label}
                    <ArrowRight className="h-4 w-4 opacity-40" />
                  </Link>
                ))}
              </div>

              {/* Mobile CTA */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 border-white/[0.1] text-foreground hover:bg-white/[0.04]"
                  asChild
                >
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button
                  className="flex-1 bg-gold hover:bg-gold-light text-background font-medium"
                  asChild
                >
                  <Link href="/register">Get Started</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer for fixed nav */}
      <div className="h-16" />
    </>
  )
}
