"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { getAdminRoutePrefix } from "@/lib/admin-route"
import { isAdminRole } from "@/lib/auth/admin-roles"
import {
  LayoutDashboard,
  Compass,
  Store,
  Bookmark,
  Download,
  FolderOpen,
  MessageSquare,
  Bell,
  Package,
  Upload,
  BarChart3,
  DollarSign,
  Wallet,
  Users,
  Star,
  Settings,
  Shield,
  ShieldCheck,
  FileText,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Key,
  Code,
  Activity,
  Globe,
  FileText as FileTextIcon,
  Settings as SettingsIcon,
} from "lucide-react"

interface SidebarProps {
  userRole?: string
}

const navSections = [
  {
    label: null,
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/explore", label: "Explore", icon: Compass },
      { href: "/explore", label: "Explore", icon: Store },
    ],
  },
  {
    label: "Library",
    items: [
      { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
      { href: "/downloads", label: "Downloads", icon: Download },
      { href: "/collections", label: "Collections", icon: FolderOpen },
    ],
  },
  {
    label: "Social",
    items: [
      { href: "/messages", label: "Messages", icon: MessageSquare },
      { href: "/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "Creator",
    items: [
      { href: "/creator/dashboard", label: "Overview", icon: BarChart3 },
      { href: "/creator/listings", label: "My Listings", icon: Package },
      { href: "/creator/upload", label: "Upload Asset", icon: Upload },
      { href: "/creator/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/creator/revenue", label: "Revenue", icon: DollarSign },
      { href: "/creator/payouts", label: "Payouts", icon: Wallet },
      { href: "/creator/followers", label: "Followers", icon: Users },
      { href: "/creator/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    label: "Developer",
    items: [
      { href: "/developers", label: "Dashboard", icon: Sparkles },
      { href: "/developers/keys", label: "API Keys", icon: Key },
      { href: "/developers/webhooks", label: "Webhooks", icon: Bell },
      { href: "/developers/applications", label: "Applications", icon: Package },
      { href: "/developer/mcp", label: "MCP Servers", icon: ShieldCheck },
      { href: "/developers/usage", label: "Usage Analytics", icon: BarChart3 },
      { href: "/developers/playground", label: "API Playground", icon: Code },
      { href: "/developers/logs", label: "Logs", icon: Activity },
      { href: "/api-docs", label: "Documentation", icon: FileTextIcon },
      { href: "/developers/settings", label: "Settings", icon: SettingsIcon },
    ],
  },
]

const adminSection = {
  label: "Admin",
  // Uses env-based route alias (e.g. /control-panel) when configured.
  // Middleware rewrites alias -> /admin internally.
  prefix: getAdminRoutePrefix(),
  items: [
    { href: "/dashboard", label: "Overview", icon: Shield },
    { href: "/users", label: "Users", icon: Users },
    { href: "/listings", label: "Listings", icon: FileText },
    { href: "/settings", label: "Settings", icon: Settings },
  ],
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  const sections = isAdminRole(userRole)
    ? [...navSections, adminSection]
    : navSections

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
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5 scrollbar-thin">
        {sections.map((section, si) => (
          <div key={si}>
            {section.label && !collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold text-white/30 uppercase tracking-[0.1em]">
                {section.label}
              </p>
            )}
            {section.label && collapsed && (
              <div className="h-px mx-2 mb-2 bg-white/[0.06]" />
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const href = "prefix" in section ? `${section.prefix}${item.href}` : item.href
                const active = isActive(href)
                return (
                  <li key={href}>
                    <Link
                      href={href}
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
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom spacer */}
      <div className="px-2 py-3 border-t border-white/[0.06]" />
    </aside>
  )
}
