"use client"

import Link from "next/link"
import { Search, Menu, User, PlusCircle, Sparkles, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function Navbar() {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group cursor-pointer">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cta to-cta-light flex items-center justify-center group-hover:scale-105 transition-smooth shadow-glow">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xl font-bold text-text-primary">MidasAI</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              <Link href="/skills" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-smooth cursor-pointer">
                Skills
              </Link>
              <Link href="/plugins" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-smooth cursor-pointer">
                Plugins
              </Link>
              <Link href="/mcp" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-smooth cursor-pointer">
                MCP
              </Link>
              <Link href="/agents" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-smooth cursor-pointer">
                Agents
              </Link>
              <Link href="/workflows" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-smooth cursor-pointer">
                Workflows
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="search"
                  placeholder="Search..."
                  className="h-10 w-64 rounded-lg border bg-surface text-text-primary placeholder:text-text-tertiary pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta transition-smooth"
                />
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-surface transition-smooth cursor-pointer">
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

            <Button asChild className="shadow-glow">
              <Link href="/auth/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
