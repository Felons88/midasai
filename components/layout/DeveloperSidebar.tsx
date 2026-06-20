"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  LayoutDashboard,
  Key,
  Bell,
  Package,
  Server,
  BarChart3,
  Activity,
  FileText,
  Settings,
  ArrowLeft,
  HardDrive,
  Zap,
  LogOut,
  Sparkles,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

interface DeveloperSidebarProps {
  userName?: string
  userEmail?: string
  userAvatar?: string
  subscriptionTier?: string
  storageUsed?: number
  storageTotal?: number
  apiUsage?: number
}

const developerNav = [
  { href: "/developer", label: "Dashboard", icon: LayoutDashboard },
  { href: "/developer/keys", label: "API Keys", icon: Key },
  { href: "/developer/webhooks", label: "Webhooks", icon: Bell },
  { href: "/developer/applications", label: "Applications", icon: Package },
  { href: "/developer/mcp", label: "MCP Servers", icon: Server },
  { href: "/developer/usage", label: "Analytics", icon: BarChart3 },
  { href: "/developer/billing", label: "Billing", icon: FileText },
  { href: "/developer/logs", label: "Logs", icon: Activity },
  { href: "/developer/settings", label: "Settings", icon: Settings },
]

export function DeveloperSidebar({
  userName,
  userEmail,
  userAvatar,
  subscriptionTier = "FREE",
  storageUsed = 0,
  storageTotal = 10,
  apiUsage = 0,
}: DeveloperSidebarProps) {
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

  const storagePercentage = Math.min((storageUsed / storageTotal) * 100, 100)

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen border-r border-white/[0.06] bg-[#0a0a0f]/98 backdrop-blur-2xl flex flex-col transition-all duration-300 ease-in-out ${
        collapsed ? "w-[68px]" : "w-[280px]"
      }`}
    >
      {/* Logo + Collapse */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-white/[0.06]">
        <Link href="/developer" className="flex items-center gap-2.5 group overflow-hidden">
          <div className="h-8 w-8 min-w-[32px] rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Sparkles className="h-4 w-4 text-black" />
          </div>
          {!collapsed && (
            <span className="text-base font-bold text-white whitespace-nowrap">Developer Portal</span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/[0.06]"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* User Info */}
      {!collapsed && (
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center border border-amber-500/30">
              {userAvatar ? (
                <img src={userAvatar} alt={userName} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <span className="text-sm font-semibold text-amber-400">{initials}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName || "Developer"}</p>
              <p className="text-xs text-amber-400 font-semibold">{subscriptionTier} PLAN</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-1">
          {developerNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive(item.href)
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "text-white/60 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <item.icon className={`h-5 w-5 flex-shrink-0 ${collapsed ? "mx-auto" : ""}`} />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Back to Marketplace */}
        <div className="mt-6 pt-6 border-t border-white/[0.06]">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.04] transition-all duration-200"
          >
            <ArrowLeft className={`h-5 w-5 flex-shrink-0 ${collapsed ? "mx-auto" : ""}`} />
            {!collapsed && <span className="text-sm font-medium">Back to Marketplace</span>}
          </Link>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-white/[0.06] p-4 space-y-4">
        {/* Storage Usage */}
        {!collapsed && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-white/60">
                <HardDrive className="h-4 w-4" />
                <span className="text-xs">Storage</span>
              </div>
              <span className="text-xs text-white/60">{storageUsed.toFixed(1)} GB / {storageTotal} GB</span>
            </div>
            <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                style={{ width: `${storagePercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* API Usage */}
        {!collapsed && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-white/60">
                <Zap className="h-4 w-4" />
                <span className="text-xs">API Requests</span>
              </div>
              <span className="text-xs text-white/60">{apiUsage.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Sign Out */}
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={`w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 ${
            collapsed ? "px-0" : ""
          }`}
        >
          <LogOut className={`h-5 w-5 ${collapsed ? "mx-auto" : ""}`} />
          {!collapsed && <span className="ml-3">Sign Out</span>}
        </Button>
      </div>
    </aside>
  )
}
