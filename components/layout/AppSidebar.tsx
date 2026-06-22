"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  LayoutDashboard, Activity, Bell, Users, FileText, Receipt,
  CreditCard, Briefcase, CalendarDays, Clock, Store, Search,
  UserCheck, Package, Server, Sparkles, Bot, Zap, Star,
  LayoutGrid, DollarSign, BarChart3, Plug2, Settings,
  ChevronLeft, ChevronRight, Crown, Database, LogOut, LifeBuoy,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

interface AppSidebarProps {
  userRole?: string
  userName?: string
  userEmail?: string
  userAvatar?: string
  mobileOpen?: boolean
  onMobileClose?: () => void
}

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  badge?: string
}

interface NavGroup {
  label: string
  items: NavItem[]
  roleRequired?: string[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "HOME",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/feed", label: "Activity Feed", icon: Activity },
      { href: "/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "MARKETPLACE",
    items: [
      { href: "/explore", label: "Browse Services", icon: Search },
      { href: "/bookmarks", label: "Saved Items", icon: Star },
      { href: "/purchases", label: "Purchases", icon: Receipt },
      { href: "/developer/mcp", label: "MCP Marketplace", icon: Server },
    ],
  },
  {
    label: "AI",
    items: [
      { href: "/ai/assistant", label: "AI Assistant", icon: Bot, badge: "Soon" },
      { href: "/ai/automations", label: "AI Automations", icon: Zap, badge: "Soon" },
      { href: "/notifications", label: "AI Notifications", icon: Sparkles },
    ],
  },
  {
    label: "CREATOR",
    roleRequired: ["CREATOR", "ADMIN", "OWNER"],
    items: [
      { href: "/creator/dashboard", label: "Creator Dashboard", icon: LayoutGrid },
      { href: "/creator/listings", label: "Products", icon: Package },
      { href: "/creator/upload", label: "New Product", icon: Store },
      { href: "/developer/mcp", label: "MCP Servers", icon: Server },
      { href: "/creator/payouts", label: "Revenue", icon: DollarSign },
      { href: "/creator/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "BUSINESS",
    items: [
      { href: "/developer/billing", label: "Billing", icon: CreditCard },
      { href: "/developer", label: "Integrations", icon: Plug2 },
      { href: "/settings", label: "Settings", icon: Settings },
      { href: "/support", label: "Support", icon: LifeBuoy },
    ],
  },
]

export function AppSidebar({
  userRole,
  userName,
  userEmail,
  userAvatar,
  mobileOpen = false,
  onMobileClose,
}: AppSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"))

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : userEmail?.charAt(0).toUpperCase() || "?"

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const visibleGroups = NAV_GROUPS.filter((g) => {
    if (!g.roleRequired) return true
    return g.roleRequired.includes(userRole || "")
  })

  useEffect(() => {
    onMobileClose?.()
    // Close the drawer after navigation without coupling desktop collapse state to routes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const showLabels = !collapsed || mobileOpen

  return (
    <aside
      className={`fixed left-0 top-0 z-50 flex h-dvh w-[280px] max-w-[85vw] flex-col border-r border-white/[0.06] bg-[#08080f] transition-all duration-300 ease-in-out md:max-w-none ${
        collapsed ? "md:w-[64px]" : "md:w-[240px]"
      } ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-white/[0.06] flex-shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5 group overflow-hidden">
          <div className="h-8 w-8 min-w-[32px] rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-shadow">
            <Sparkles className="h-4 w-4 text-black" />
          </div>
          {showLabels && (
            <span className="text-[15px] font-bold text-white tracking-tight whitespace-nowrap">MidasAI</span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden h-6 w-6 min-w-[24px] items-center justify-center rounded-md text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/70 md:flex"
          aria-label={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin">
        {visibleGroups.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? "mt-1" : ""}>
            {/* Group label */}
            {showLabels && (
              <p className="px-4 pt-3 pb-1 text-[10px] font-semibold tracking-widest text-white/25 uppercase select-none">
                {group.label}
              </p>
            )}
            {!showLabels && gi > 0 && <div className="mx-3 my-2 h-px bg-white/[0.06]" />}

            <div className="px-2 space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    title={!showLabels ? item.label : undefined}
                    className={`group flex items-center gap-3 px-2.5 py-[7px] rounded-lg text-[13px] font-medium transition-all duration-150 ${
                      active
                        ? "bg-amber-500/[0.12] text-white"
                        : "text-white/40 hover:text-white/80 hover:bg-white/[0.04]"
                    } ${!showLabels ? "justify-center" : ""}`}
                  >
                    <Icon
                      className={`h-[15px] w-[15px] flex-shrink-0 transition-colors ${
                        active ? "text-amber-400" : "group-hover:text-white/70"
                      }`}
                    />
                    {showLabels && (
                      <span className="flex-1 truncate leading-none">{item.label}</span>
                    )}
                    {showLabels && item.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/30 uppercase tracking-wide">
                        {item.badge}
                      </span>
                    )}
                    {active && showLabels && (
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="flex-shrink-0 border-t border-white/[0.06] p-3 space-y-1">
        {/* Avatar row */}
        <div className={`flex items-center gap-3 px-1 py-1.5 ${!showLabels ? "justify-center" : ""}`}>
          {userAvatar ? (
            <img src={userAvatar} alt={userName || "User"} className="h-7 w-7 min-w-[28px] rounded-full object-cover ring-1 ring-white/10" />
          ) : (
            <div className="h-7 w-7 min-w-[28px] rounded-full bg-gradient-to-br from-amber-400/80 to-amber-600/80 flex items-center justify-center ring-1 ring-white/10">
              <span className="text-[10px] font-bold text-black">{initials}</span>
            </div>
          )}
          {showLabels && (
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-white/80 truncate leading-tight">{userName || "User"}</p>
              <p className="text-[10px] text-white/25 truncate leading-tight mt-0.5">{userRole || "USER"}</p>
            </div>
          )}
        </div>

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-medium text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-colors ${
            !showLabels ? "justify-center" : ""
          }`}
          title={!showLabels ? "Sign out" : undefined}
        >
          <LogOut className="h-[15px] w-[15px] flex-shrink-0" />
          {showLabels && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  )
}
