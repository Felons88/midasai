"use client"

import { useState, useRef, useEffect } from "react"
import { Search, MessageSquare, Plus, Command, User, CreditCard, ShieldCheck, Settings, Code, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { NotificationBell } from "@/components/notifications/NotificationCenter"
import { CreditPill } from "@/components/billing/CreditPill"

interface TopBarProps {
  userEmail?: string
  userName?: string
  userAvatar?: string
  onSearchOpen?: () => void
}

export function TopBar({ userEmail, userName, userAvatar, onSearchOpen }: TopBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : userEmail?.charAt(0).toUpperCase() || '?'

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const accountLinks = [
    { href: "/account/profile", label: "Profile", icon: User },
    { href: "/account/billing", label: "Billing", icon: CreditCard },
    { href: "/account/security", label: "Security", icon: ShieldCheck },
    { href: "/account/settings", label: "Settings", icon: Settings },
    { href: "/developers", label: "Developer Portal", icon: Code },
  ]

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl flex items-center justify-between px-6">
      {/* Search Trigger */}
      <button
        onClick={onSearchOpen}
        className="flex items-center gap-3 h-9 px-4 rounded-lg border border-white/[0.08] bg-white/[0.02] text-white/40 hover:text-white/60 hover:border-white/[0.12] hover:bg-white/[0.04] transition-all text-sm w-full max-w-[320px]"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Search everything...</span>
        <kbd className="hidden md:flex items-center gap-0.5 h-5 px-1.5 rounded bg-white/[0.06] text-[10px] font-medium text-white/30">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      {/* Right Actions */}
      <div className="flex items-center gap-1">
        <CreditPill />

        {/* Quick Create */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-white/40 hover:text-white hover:bg-white/[0.06]"
          asChild
        >
          <Link href="/creator/upload">
            <Plus className="h-4 w-4" />
          </Link>
        </Button>

        {/* Messages */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-white/40 hover:text-white hover:bg-white/[0.06]"
          asChild
        >
          <Link href="/messages">
            <MessageSquare className="h-4 w-4" />
          </Link>
        </Button>

        {/* Notifications */}
        <NotificationBell />

        {/* Divider */}
        <div className="h-6 w-px bg-white/[0.06] mx-2" />

        {/* User Avatar + Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 h-8 px-2 rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName || 'User'}
                className="h-7 w-7 rounded-full object-cover ring-1 ring-white/10"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-400/80 to-amber-600/80 flex items-center justify-center ring-1 ring-white/10">
                <span className="text-[11px] font-bold text-black">{initials}</span>
              </div>
            )}
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/[0.08] bg-[#111118] shadow-2xl overflow-hidden z-50">
              {/* User info */}
              <div className="px-4 py-3 border-b border-white/[0.06]">
                {userName && <p className="text-sm font-medium text-white truncate">{userName}</p>}
                {userEmail && <p className="text-[11px] text-white/30 truncate">{userEmail}</p>}
              </div>

              {/* Account links */}
              <div className="py-1.5">
                {accountLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-[13px] text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors"
                  >
                    <item.icon className="h-4 w-4 text-white/30" />
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* Sign out */}
              <div className="border-t border-white/[0.06] py-1.5">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2 text-[13px] text-red-400/80 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors w-full"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
