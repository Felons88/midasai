"use client"

import Link from "next/link"
import { Search, User, PlusCircle, Sparkles, LogOut, LayoutDashboard, Bookmark, Bell, Settings, ChevronDown, Store, Compass } from "lucide-react"
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
import { useState, useEffect } from "react"

export function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email?: string; name?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0],
        })
      }
      setLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
        })
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push("/")
    router.refresh()
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
            
            <div className="hidden lg:flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-smooth rounded-lg hover:bg-surface">
                    <Store className="h-4 w-4" />
                    Marketplace
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/skills">Claude Skills</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/plugins">Cursor Rules</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/mcp">MCP Servers</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/agents">AI Agents</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/workflows">Workflows</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/templates">Templates</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/prompts">Prompts</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Link href="/search" className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-smooth rounded-lg hover:bg-surface">
                <Compass className="h-4 w-4" />
                Explore
              </Link>
              <Link href="/pricing" className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-smooth rounded-lg hover:bg-surface">
                Pricing
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="search"
                  placeholder="Search..."
                  className="h-9 w-56 rounded-lg border bg-surface text-text-primary placeholder:text-text-tertiary pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta transition-smooth"
                />
              </div>
            </div>

            {!loading && user ? (
              <>
                <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-surface transition-smooth">
                  <Bell className="h-5 w-5 text-text-secondary hover:text-text-primary" />
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface transition-smooth">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cta to-cta-light flex items-center justify-center text-primary text-sm font-bold">
                        {(user.name || user.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <span className="hidden md:block text-sm font-medium text-text-primary max-w-[120px] truncate">
                        {user.name || user.email}
                      </span>
                      <ChevronDown className="h-3 w-3 text-text-tertiary" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/bookmarks" className="flex items-center gap-2">
                        <Bookmark className="h-4 w-4" />
                        Bookmarks
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/creator/dashboard" className="flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        Creator Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/creator/upload" className="flex items-center gap-2">
                        <PlusCircle className="h-4 w-4" />
                        Upload Listing
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-400 cursor-pointer">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : !loading ? (
              <>
                <Button variant="ghost" asChild className="text-text-secondary hover:text-text-primary">
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button asChild className="shadow-glow">
                  <Link href="/auth/register">Get Started</Link>
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  )
}
