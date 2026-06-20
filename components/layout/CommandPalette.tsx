"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  LayoutDashboard,
  Package,
  Upload,
  BarChart3,
  Bookmark,
  Settings,
  User,
  Store,
  FileText,
  ArrowRight,
} from "lucide-react"

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

const commands = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Navigation" },
  { label: "Marketplace", href: "/marketplace", icon: Store, group: "Navigation" },
  { label: "Explore", href: "/explore", icon: Search, group: "Navigation" },
  { label: "Bookmarks", href: "/bookmarks", icon: Bookmark, group: "Navigation" },
  { label: "My Listings", href: "/creator/listings", icon: Package, group: "Creator" },
  { label: "Upload Asset", href: "/creator/upload", icon: Upload, group: "Creator" },
  { label: "Analytics", href: "/creator/analytics", icon: BarChart3, group: "Creator" },
  { label: "Revenue", href: "/creator/revenue", icon: BarChart3, group: "Creator" },
  { label: "Profile", href: "/account/profile", icon: User, group: "Account" },
  { label: "Settings", href: "/account/settings", icon: Settings, group: "Account" },
  { label: "Notifications", href: "/notifications", icon: FileText, group: "Navigation" },
]

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const filtered = query
    ? commands.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.group.toLowerCase().includes(query.toLowerCase())
      )
    : commands

  useEffect(() => {
    if (open) {
      setQuery("")
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!open) return

      if (e.key === "Escape") {
        onClose()
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, filtered.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (filtered[selectedIndex]) {
          router.push(filtered[selectedIndex].href)
          onClose()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, filtered, selectedIndex, router, onClose])

  if (!open) return null

  const groups = filtered.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = []
    acc[item.group].push(item)
    return acc
  }, {} as Record<string, typeof commands>)

  let globalIndex = -1

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative flex items-start justify-center pt-[20vh]">
        <div className="w-full max-w-[560px] mx-4 bg-[#111118] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden">
          {/* Input */}
          <div className="flex items-center gap-3 px-4 h-12 border-b border-white/[0.06]">
            <Search className="h-4 w-4 text-white/30" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedIndex(0) }}
              placeholder="Search commands, pages, assets..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
            />
            <kbd className="h-5 px-1.5 rounded bg-white/[0.06] text-[10px] font-medium text-white/30 flex items-center">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[360px] overflow-y-auto py-2">
            {Object.entries(groups).map(([group, items]) => (
              <div key={group}>
                <p className="px-4 py-1 text-[10px] font-semibold text-white/25 uppercase tracking-wider">
                  {group}
                </p>
                {items.map((item) => {
                  globalIndex++
                  const idx = globalIndex
                  const isSelected = idx === selectedIndex
                  return (
                    <button
                      key={item.href}
                      onClick={() => { router.push(item.href); onClose() }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center gap-3 w-full px-4 py-2 text-sm transition-colors ${
                        isSelected
                          ? "bg-white/[0.06] text-white"
                          : "text-white/60 hover:bg-white/[0.04]"
                      }`}
                    >
                      <item.icon className="h-4 w-4 text-white/40" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {isSelected && <ArrowRight className="h-3.5 w-3.5 text-white/30" />}
                    </button>
                  )
                })}
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-white/30">No results found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
