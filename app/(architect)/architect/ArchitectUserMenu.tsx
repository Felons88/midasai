"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { User, Settings, Key, BookOpen, LogOut, ChevronDown } from "lucide-react"

interface ArchitectUserMenuProps {
  name: string
  email: string
  avatar: string
}

export function ArchitectUserMenu({ name, email, avatar }: ArchitectUserMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const initials = (name || email || "U")[0].toUpperCase()

  const menuItems = [
    { icon: User,     label: "Profile",  href: "/profile" },
    { icon: Settings, label: "Settings", href: "/settings" },
    { icon: Key,      label: "API Keys", href: "/settings/api" },
    { icon: BookOpen, label: "API Docs", href: "/api-docs" },
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all group"
        style={{ background: open ? "rgba(255,255,255,0.08)" : "transparent", border: "1px solid transparent" }}
        onMouseEnter={e => { if (!open) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)" }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.background = "transparent" }}
      >
        <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
          {avatar
            ? <img src={avatar} alt="" className="w-full h-full object-cover" />
            : <span className="text-[11px] font-bold text-zinc-300">{initials}</span>
          }
        </div>
        <span className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors max-w-[80px] truncate hidden sm:block">
          {name || email}
        </span>
        <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden z-50"
          style={{ background: "#111113", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 16px 48px rgba(0,0,0,0.6)" }}
        >
          {/* User info header */}
          <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="text-xs font-semibold text-white truncate">{name || "Account"}</div>
            <div className="text-[10px] text-zinc-500 truncate mt-0.5">{email}</div>
          </div>

          {/* Menu items */}
          <div className="p-1.5 space-y-0.5">
            {menuItems.map(({ icon: Icon, label, href }) => (
              <Link
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-white transition-all group"
                style={{ background: "transparent" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
              >
                <Icon className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-300 transition-colors flex-shrink-0" />
                {label}
              </Link>
            ))}
          </div>

          {/* Logout */}
          <div className="p-1.5 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-red-400 transition-all group"
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.06)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
            >
              <LogOut className="w-3.5 h-3.5 text-zinc-600 group-hover:text-red-400 transition-colors flex-shrink-0" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
