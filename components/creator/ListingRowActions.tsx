"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Archive, Trash2, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

type ConfirmAction = "archive" | "delete" | null

interface ListingRowActionsProps {
  listingId: string
  listingTitle: string
  status: string
}

export function ListingRowActions({ listingId, listingTitle, status }: ListingRowActionsProps) {
  const router = useRouter()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    if (!confirmAction) return

    setLoading(true)
    setError(null)

    const supabase = createClient()

    if (confirmAction === "archive") {
      const { error: updateError } = await supabase
        .from("listings")
        .update({ status: "SUSPENDED", updated_at: new Date().toISOString() })
        .eq("id", listingId)

      setLoading(false)

      if (updateError) {
        setError(updateError.message)
        return
      }
    } else {
      const { error: deleteError } = await supabase.from("listings").delete().eq("id", listingId)

      setLoading(false)

      if (deleteError) {
        setError(deleteError.message)
        return
      }
    }

    setConfirmAction(null)
    router.refresh()
  }

  const isArchive = confirmAction === "archive"

  return (
    <>
      {status !== "SUSPENDED" && (
        <Button
          variant="outline"
          size="sm"
          className="transition-smooth"
          onClick={() => setConfirmAction("archive")}
        >
          <Archive className="h-4 w-4 mr-2" />
          Archive
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        className="transition-smooth text-destructive hover:text-destructive"
        onClick={() => setConfirmAction("delete")}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </Button>

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !loading && setConfirmAction(null)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            className="relative w-full max-w-md rounded-xl border border-white/10 bg-card p-6 shadow-glow animate-fade-in-up"
          >
            <button
              type="button"
              className="absolute right-4 top-4 rounded p-1 text-text-tertiary hover:text-text-primary transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta"
              onClick={() => !loading && setConfirmAction(null)}
              aria-label="Close dialog"
              disabled={loading}
            >
              <X className="h-4 w-4" />
            </button>

            <h2 id="confirm-dialog-title" className="text-lg font-semibold text-text-primary pr-8">
              {isArchive ? "Archive listing?" : "Delete listing?"}
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              {isArchive ? (
                <>
                  <span className="font-medium text-text-primary">{listingTitle}</span> will be
                  suspended and hidden from the marketplace. You can restore it later by changing
                  its status.
                </>
              ) : (
                <>
                  <span className="font-medium text-text-primary">{listingTitle}</span> will be
                  permanently deleted. This action cannot be undone.
                </>
              )}
            </p>

            {error && (
              <p className="mt-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setConfirmAction(null)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant={isArchive ? "default" : "destructive"}
                className={isArchive ? "shadow-glow" : undefined}
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? "Processing..." : isArchive ? "Archive" : "Delete permanently"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
