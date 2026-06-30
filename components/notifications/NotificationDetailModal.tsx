"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { X, Bell, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AppNotification } from "./NotificationProvider"

type NotificationDetailModalProps = {
  notification: AppNotification | null
  onClose: () => void
  onMarkRead?: (id: string) => void
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function NotificationDetailModal({
  notification,
  onClose,
  onMarkRead,
}: NotificationDetailModalProps) {
  const [resolved, setResolved] = useState<AppNotification | null>(notification)

  useEffect(() => {
    setResolved(notification)
  }, [notification])

  useEffect(() => {
    if (!notification) return
    const meta = notification.metadata ?? {}
    if (typeof meta.changelog_id !== "string" || meta.changelog_body) return

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/announcements/${meta.changelog_id}`)
        if (!res.ok) return
        const data = await res.json()
        if (cancelled || !data.announcement) return
        setResolved({
          ...notification,
          metadata: {
            ...meta,
            changelog_body: data.announcement.body,
            changelog_version: data.announcement.version,
            changelog_title: data.announcement.title,
          },
        })
      } catch {
        // fallback to message
      }
    })()

    return () => {
      cancelled = true
    }
  }, [notification])

  const meta = resolved?.metadata ?? {}
  const changelogBody =
    typeof meta.changelog_body === "string" ? meta.changelog_body : null
  const changelogVersion =
    typeof meta.changelog_version === "string" ? meta.changelog_version : null
  const body = resolved ? changelogBody || resolved.message : ""

  useEffect(() => {
    if (!resolved?.read && onMarkRead && resolved) {
      onMarkRead(resolved.id)
    }
  }, [resolved?.id, resolved?.read, onMarkRead, resolved])

  if (!resolved) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close notification"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0c0c12] shadow-2xl overflow-hidden"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.08] p-5">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
              <Bell className="h-5 w-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              {changelogVersion && (
                <p className="text-xs font-medium text-amber-400/80 mb-0.5">v{changelogVersion}</p>
              )}
              <h2 className="text-lg font-semibold text-white leading-tight">{resolved.title}</h2>
              <p className="text-xs text-white/40 mt-1">{formatWhen(resolved.created_at)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/40 hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-5 text-sm text-white/75 whitespace-pre-wrap leading-relaxed">
          {body}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.08] p-4">
          {resolved.action_url && (
            <Button asChild size="sm" variant="outline" className="border-white/10">
              <Link href={resolved.action_url} onClick={onClose}>
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                {resolved.action_label ?? "Open link"}
              </Link>
            </Button>
          )}
          <Button type="button" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
