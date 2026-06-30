"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PendingChangelog } from "@/lib/announcements/types"

type ChangelogPopupProps = {
  announcement: PendingChangelog
}

export function ChangelogPopup({ announcement }: ChangelogPopupProps) {
  const [open, setOpen] = useState(true)
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  async function acknowledge(action: "confirmed" | "dismissed" | "learn_more") {
    setBusy(true)
    try {
      const res = await fetch(`/api/announcements/${announcement.id}/dismiss`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error("Failed to save")
      setOpen(false)
      router.refresh()
    } catch {
      alert("Could not save your response. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="changelog-title"
        className="relative w-full max-w-lg rounded-2xl border border-amber-500/25 bg-[#0c0c12] shadow-2xl shadow-amber-500/10 overflow-hidden"
      >
        <div className="h-1 bg-gradient-to-r from-amber-500/80 via-amber-400 to-amber-600/80" />
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              {announcement.version && (
                <p className="text-xs font-medium text-amber-400/80 mb-0.5">
                  v{announcement.version}
                </p>
              )}
              <h2 id="changelog-title" className="text-lg font-semibold text-white">
                {announcement.title}
              </h2>
              <p className="text-xs text-white/40 mt-1">What&apos;s new on MidasAI</p>
            </div>
          </div>

          <div className="text-sm text-white/70 whitespace-pre-wrap max-h-64 overflow-y-auto mb-6 leading-relaxed">
            {announcement.body}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {announcement.action_url && (
              <Button asChild size="sm" variant="outline" className="border-white/10" disabled={busy}>
                <Link
                  href={announcement.action_url}
                  onClick={() => acknowledge("learn_more")}
                >
                  {announcement.action_label ?? "Learn more"}
                </Link>
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              className="shadow-glow"
              onClick={() => acknowledge("confirmed")}
              disabled={busy}
            >
              {busy ? "Saving…" : "Confirm"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
