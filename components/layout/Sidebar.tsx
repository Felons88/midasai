"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  BarChart3,
  DollarSign,
  Upload,
  Bookmark,
  Bell,
  Settings,
  User,
  LogOut,
  Sparkles,
  Shield,
  Users,
  FileText,
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface SidebarProps {
  userRole?: string
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const mainNav = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
    { href: "/notifications", label: "Notifications", icon: Bell },
  ]

  const creatorNav = [
    { href: "/creator/dashboard", label: "Creator Hub", icon: BarChart3 },
    { href: "/creator/listings", label: "My Listings", icon: Package },
    { href: "/creator/upload", label: "Upload", icon: Upload },
    { href: "/creator/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/creator/payouts", label: "Payouts", icon: DollarSign },
  ]

  const adminNav = [
    { href: "/admin/dashboard", label: "Admin", icon: Shield },
    { href: "/admin/listings", label: "All Listings", icon: FileText },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/settings", label: "Platform Settings", icon: Settings },
  ]

  const accountNav = [
    { href: "/profile", label: "Profile", icon: User },
    { href: "/settings", label: "Settings", icon: Settings },
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/5 bg-background/95 backdrop-blur-xl flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 h-16 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cta to-cta-light flex items-center justify-center group-hover:scale-105 transition-smooth shadow-glow">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xl font-bold text-text-primary">MidasAI</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Main */}
        <div>
          <p className="px-3 mb-2 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Main</p>
          <ul className="space-y-1">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth ${
                    isActive(item.href)
                      ? "bg-cta/10 text-cta shadow-sm"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Creator */}
        <div>
          <p className="px-3 mb-2 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Creator</p>
          <ul className="space-y-1">
            {creatorNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth ${
                    isActive(item.href)
                      ? "bg-cta/10 text-cta shadow-sm"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Admin - only show for admin/owner roles */}
        {(userRole === 'ADMIN' || userRole === 'OWNER') && (
          <div>
            <p className="px-3 mb-2 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Admin</p>
            <ul className="space-y-1">
              {adminNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth ${
                      isActive(item.href)
                        ? "bg-cta/10 text-cta shadow-sm"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Account */}
        <div>
          <p className="px-3 mb-2 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Account</p>
          <ul className="space-y-1">
            {accountNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth ${
                    isActive(item.href)
                      ? "bg-cta/10 text-cta shadow-sm"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-smooth w-full"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
