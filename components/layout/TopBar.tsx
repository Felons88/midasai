"use client"

import { Search, Bell, MessageSquare, Plus, Command } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface TopBarProps {
  userEmail?: string
  userName?: string
  userAvatar?: string
  onSearchOpen?: () => void
}

export function TopBar({ userEmail, userName, userAvatar, onSearchOpen }: TopBarProps) {
  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : userEmail?.charAt(0).toUpperCase() || '?'

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
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-white/40 hover:text-white hover:bg-white/[0.06] relative"
          asChild
        >
          <Link href="/notifications">
            <Bell className="h-4 w-4" />
          </Link>
        </Button>

        {/* Divider */}
        <div className="h-6 w-px bg-white/[0.06] mx-2" />

        {/* User Avatar */}
        <Link
          href="/account/profile"
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
        </Link>
      </div>
    </header>
  )
}
