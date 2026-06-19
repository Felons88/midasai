"use client"

import Link from "next/link"
import { Search, Menu, User, PlusCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">MidasAI</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              <Link href="/skills" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Skills
              </Link>
              <Link href="/plugins" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Plugins
              </Link>
              <Link href="/mcp" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                MCP
              </Link>
              <Link href="/agents" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Agents
              </Link>
              <Link href="/workflows" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Workflows
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search..."
                  className="h-10 w-64 rounded-lg border border-input bg-background/50 backdrop-blur-sm pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                />
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-accent/50">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/auth/login">Login</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/auth/register">Register</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/creator/upload" className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4" />
                    List Your Item
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="/auth/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
