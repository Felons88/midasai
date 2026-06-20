"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  Store,
  Compass,
  Bookmark,
  Download,
  ShoppingBag,
  Wrench,
  Code,
  Settings,
  LifeBuoy,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  User,
  Crown,
  Database,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

interface AppSidebarProps {
  userRole?: string
  userName?: string
  userEmail?: string
  userAvatar?: string
}

const mainNav = [
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { href: "/downloads", label: "Downloads", icon: Download },
  { href: "/purchases", label: "Purchases", icon: ShoppingBag },
]

const creatorNav = [
  { href: "/creator/dashboard", label: "Creator Studio", icon: Wrench },
]

const developerNav = [
  { href: "/developers", label: "Developer Portal", icon: Code },
]

const bottomNav = [
  { href: "/account/settings", label: "Settings", icon: Settings },
  { href: "/support", label: "Support", icon: LifeBuoy },
]

export function AppSidebar({
  userRole,
  userName,
  userEmail,
  userAvatar,
}: AppSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/")

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : userEmail?.charAt(0).toUpperCase() || "?"

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen border-r border-white/[0.06] bg-[#0a0a0f]/98 backdrop-blur-2xl flex flex-col transition-all duration-300 ease-in-out ${
        collapsed ? "w-[68px]" : "w-[260px]"
      }`}
    >
      {/* Logo + Collapse */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-2.5 group overflow-hidden">
          <div className="h-8 w-8 min-w-[32px] rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Sparkles className="h-4 w-4 text-black" />
          </div>
          {!collapsed && (
            <span className="text-base font-bold text-white whitespace-nowrap">MidasAI</span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="h-7 w-7 min-w-[28px] flex items-center justify-center rounded-md hover:bg-white/[0.06] text-white/40 hover:text-white/80 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 scrollbar-thin">
        {mainNav.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                active
                  ? "bg-white/[0.08] text-white shadow-sm"
                  : "text-white/50 hover:text-white/90 hover:bg-white/[0.04]"
              } ${collapsed ? "justify-center px-0" : ""}`}
            >
              <item.icon className={`h-4 w-4 flex-shrink-0 ${active ? "text-amber-400" : ""}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}

        {/* Divider */}
        <div className="my-3 h-px bg-white/[0.06]" />

        {/* Creator Studio */}
        {(userRole === "CREATOR" || userRole === "ADMIN" || userRole === "OWNER") && (
          <>
            {creatorNav.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                    active
                      ? "bg-white/[0.08] text-white shadow-sm"
                      : "text-white/50 hover:text-white/90 hover:bg-white/[0.04]"
                  } ${collapsed ? "justify-center px-0" : ""}`}
                >
                  <item.icon className={`h-4 w-4 flex-shrink-0 ${active ? "text-amber-400" : ""}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              )
            })}
          </>
        )}

        {/* Developer Portal */}
        {(userRole === "DEVELOPER" || userRole === "CREATOR" || userRole === "ADMIN" || userRole === "OWNER") && (
          <>
            {developerNav.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                    active
                      ? "bg-white/[0.08] text-white shadow-sm"
                      : "text-white/50 hover:text-white/90 hover:bg-white/[0.04]"
                  } ${collapsed ? "justify-center px-0" : ""}`}
                >
                  <item.icon className={`h-4 w-4 flex-shrink-0 ${active ? "text-amber-400" : ""}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              )
            })}
          </>
        )}

        {/* Divider */}
        <div className="my-3 h-px bg-white/[0.06]" />

        {/* Bottom Nav */}
        {bottomNav.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                active
                  ? "bg-white/[0.08] text-white shadow-sm"
                  : "text-white/50 hover:text-white/90 hover:bg-white/[0.04]"
              } ${collapsed ? "justify-center px-0" : ""}`}
            >
              <item.icon className={`h-4 w-4 flex-shrink-0 ${active ? "text-amber-400" : ""}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: User Profile Card */}
      <div className="px-3 py-3 border-t border-white/[0.06]">
        <div
          className={`flex items-center gap-3 rounded-lg bg-white/[0.02] p-2.5 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName || "User"}
              className="h-8 w-8 rounded-full object-cover ring-1 ring-white/10"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400/80 to-amber-600/80 flex items-center justify-center ring-1 ring-white/10">
              <span className="text-[11px] font-bold text-black">{initials}</span>
            </div>
          )}
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName || "User"}</p>
              <p className="text-[11px] text-white/30 truncate">{userEmail || ""}</p>
            </div>
          )}
        </div>

        {/* Subscription Tier */}
        {!collapsed && (
          <div className="mt-3 px-2.5">
            <div className="flex items-center justify-between text-[11px] text-white/40 mb-1">
              <span className="flex items-center gap-1.5">
                <Crown className="h-3 w-3 text-amber-400" />
                Pro Plan
              </span>
              <span>Active</span>
            </div>
          </div>
        )}

        {/* Storage Usage */}
        {!collapsed && (
          <div className="mt-2 px-2.5">
            <div className="flex items-center justify-between text-[11px] text-white/40 mb-1">
              <span className="flex items-center gap-1.5">
                <Database className="h-3 w-3" />
                Storage
              </span>
              <span>45%</span>
            </div>
            <div className="h-1 w-full rounded-full bg-white/[0.06]">
              <div className="h-1 w-[45%] rounded-full bg-amber-400" />
            </div>
          </div>
        )}

        {/* Logout */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className={`mt-3 w-full text-white/40 hover:text-white hover:bg-white/[0.04] ${
            collapsed ? "px-0" : ""
          }`}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2 text-[13px]">Sign out</span>}
        </Button>
      </div>
    </aside>
  )
}
