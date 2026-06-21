"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, Sparkles, Bookmark, User, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotificationBell } from "@/components/notification-bell"

interface AuthenticatedNavbarProps {
  userName?: string
  userAvatar?: string
  userRole?: string
}

export function AuthenticatedNavbar({
  userName,
  userAvatar,
  userRole,
}: AuthenticatedNavbarProps) {
  const pathname = usePathname()
  const [commandOpen, setCommandOpen] = useState(false)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setCommandOpen(prev => !prev)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <>
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
                <Link href="/skills" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-smooth">
                  Skills
                </Link>
                <Link href="/workflows" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-smooth">
                  Workflows
                </Link>
                <Link href="/mcp" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-smooth">
                  MCP Servers
                </Link>
                <Link href="/agents" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-smooth">
                  Agents
                </Link>
                <Link href="/plugins" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-smooth">
                  Plugins
                </Link>
                <Link href="/api-docs" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-smooth">
                  API Docs
                </Link>
              </div>
            </div>

            {/* CENTER: Global Search */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="search"
                  placeholder="Search marketplace..."
                  className="h-10 w-full rounded-lg border border-white/10 bg-surface text-text-primary placeholder:text-text-tertiary pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta transition-smooth"
                />
              </div>
            </div>

            {/* RIGHT: User Actions */}
            <div className="flex items-center gap-3">
              {/* Notifications - Real-time */}
              <NotificationBell />

              {/* Bookmarks */}
              <Button variant="ghost" size="sm" asChild className="text-text-secondary hover:text-text-primary">
                <Link href="/bookmarks">
                  <Bookmark className="h-4 w-4" />
                </Link>
              </Button>

              {/* Avatar Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 text-text-secondary hover:text-text-primary">
                    <div className="h-8 w-8 rounded-full bg-surface flex items-center justify-center">
                      {userAvatar ? (
                        <img src={userAvatar} alt={userName} className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {/* Account Section */}
                  <div className="px-2 py-1.5 text-sm font-semibold text-text-tertiary">
                    Account
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="w-full cursor-pointer">
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/purchases" className="w-full cursor-pointer">
                      Purchases
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/downloads" className="w-full cursor-pointer">
                      Downloads
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/bookmarks" className="w-full cursor-pointer">
                      Bookmarks
                    </Link>
                  </DropdownMenuItem>

                  {/* Creator Section - Only show if creator */}
                  {(userRole === 'CREATOR' || userRole === 'ADMIN') && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1.5 text-sm font-semibold text-text-tertiary">
                        Creator
                      </div>
                      <DropdownMenuItem asChild>
                        <Link href="/creator/dashboard" className="w-full cursor-pointer">
                          Creator Studio
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {/* Developer Section */}
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-sm font-semibold text-text-tertiary">
                    Developer
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/developer" className="w-full cursor-pointer">
                      Developer Portal
                    </Link>
                  </DropdownMenuItem>

                  {/* Settings Section */}
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-sm font-semibold text-text-tertiary">
                    Settings
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/account/settings" className="w-full cursor-pointer">
                      Account Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/auth/logout" className="w-full cursor-pointer">
                      Logout
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Command Palette Placeholder */}
      {commandOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
          <div className="w-full max-w-2xl mx-4">
            <div className="bg-surface border border-white/10 rounded-lg shadow-xl">
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <Search className="h-4 w-4 text-text-tertiary" />
                  <input
                    type="search"
                    placeholder="Search marketplace..."
                    className="flex-1 bg-transparent text-text-primary placeholder:text-text-tertiary outline-none"
                    autoFocus
                  />
                  <kbd className="px-2 py-1 text-xs bg-surface border border-white/10 rounded">ESC</kbd>
                </div>
              </div>
            </div>
          </div>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setCommandOpen(false)}
          />
        </div>
      )}
    </>
  )
}
