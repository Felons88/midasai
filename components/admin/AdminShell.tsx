"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sparkles, ArrowLeft, Store } from "lucide-react"
import { getAdminNavItems, type AdminNavItem } from "@/lib/admin/nav"

type AdminShellProps = {
  adminPrefix: string
  children: React.ReactNode
  badges?: Partial<Record<string, number>>
}

export function AdminShell({ adminPrefix, children, badges }: AdminShellProps) {
  const pathname = usePathname()
  const nav = getAdminNavItems(adminPrefix, badges)

  return (
    <div className="flex min-h-screen bg-[#07070b]">
      <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r border-white/[0.06] bg-[#08080d]">
        <div className="px-4 py-4 border-b border-white/[0.06]">
          <Link href={`${adminPrefix}/dashboard`} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-black" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">Admin</p>
              <p className="text-[10px] text-white/40">Control center</p>
            </div>
          </Link>
        </div>

        <div className="p-2 border-b border-white/[0.06]">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-white/55 hover:bg-white/[0.04] hover:text-white transition-colors"
          >
            <Store className="h-4 w-4 shrink-0" />
            Back to marketplace
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {nav.map((item) => (
            <AdminNavLink
              key={item.href}
              item={item}
              active={pathname === item.href || pathname.startsWith(item.href + "/")}
            />
          ))}
        </nav>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden flex items-center justify-between gap-2 border-b border-white/[0.06] bg-[#08080d] px-3 py-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-amber-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Marketplace
          </Link>
          <span className="text-sm font-semibold text-white">Admin</span>
        </header>

        <div className="lg:hidden flex gap-1 overflow-x-auto p-2 border-b border-white/[0.06] bg-[#08080d]/80">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium ${
                pathname === item.href || pathname.startsWith(item.href + "/")
                  ? "bg-amber-500/15 text-amber-400"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex-1 overflow-x-hidden p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">{children}</div>
      </div>
    </div>
  )
}

function AdminNavLink({ item, active }: { item: AdminNavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
        active
          ? "bg-amber-500/10 text-amber-400"
          : "text-white/50 hover:text-white/90 hover:bg-white/[0.04]"
      }`}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      <span className="truncate flex-1">{item.label}</span>
      {item.badge != null && item.badge > 0 && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}
    </Link>
  )
}
