import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowLeft, Hammer } from "lucide-react"
import { ArchitectUserMenu } from "@/app/(architect)/architect/ArchitectUserMenu"
import type { ReactNode } from "react"

export default async function ArchitectGroupLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#09090B]">
      {/* Architect-specific navbar — clean, no marketing clutter */}
      <nav className="flex-shrink-0 flex items-center justify-between px-5 h-14 border-b border-white/[0.07] z-50" style={{ background: "rgba(9,9,11,0.95)", backdropFilter: "blur(12px)" }}>
        {/* Left: Midas Architect brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 shadow-md shadow-amber-500/20">
            <img src="/architect.png" alt="Midas Architect" className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white tracking-tight">Midas</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md text-amber-300 tracking-widest uppercase" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)" }}>Architect</span>
          </div>
        </div>

        {/* Right: history + back link + optional user indicator */}
        <div className="flex items-center gap-3">
          <Link href="/architect/workshop" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-amber-300 transition-all" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.12)" }}>
            <Hammer className="w-3.5 h-3.5" />
            Workshop
          </Link>
          <Link href="/explore" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-200 hover:text-white transition-all" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <ArrowLeft className="w-3.5 h-3.5" />
            Marketplace
          </Link>
          {user && (
            <ArchitectUserMenu
              name={user.user_metadata?.name || ""}
              email={user.email || ""}
              avatar={user.user_metadata?.avatar_url || ""}
            />
          )}
        </div>
      </nav>

      {children}
    </div>
  )
}
