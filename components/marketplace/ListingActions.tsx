"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Download, Github, Terminal, Share2 } from "lucide-react"
import { BookmarkFlow } from "@/components/marketplace/BookmarkFlow"
import { AddToCollection } from "@/components/collections/AddToCollection"
import { SkillModal } from "@/components/marketplace/SkillModal"
import { trackEvent } from "@/lib/analytics"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import {
  getAcquireButtonLabel,
  getAcquireErrorMessage,
  type ListingDelivery,
} from "@/lib/listings/delivery"

interface ListingActionsProps {
  listingId: string
  listingTitle: string
  listingPrice: number
  githubUrl?: string | null
  delivery: ListingDelivery
  initialBookmarked?: boolean
}

export function ListingActions({
  listingId,
  listingTitle,
  listingPrice,
  githubUrl,
  delivery,
  initialBookmarked = false,
}: ListingActionsProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showSkillModal, setShowSkillModal] = useState(false)
  const router = useRouter()
  const [supabase] = useState(() => createBrowserSupabaseClient())
  const isGithub = delivery === "github"
  const isInstall = delivery === "install"
  const ActionIcon = isGithub ? Github : isInstall ? Terminal : Download

  const handlePrimaryAction = async () => {
    // Install delivery — just scroll to the install tab, no API call needed
    if (isInstall) {
      const el = document.getElementById("listing-tab-install")
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" })
        el.click()
      } else {
        const section = document.querySelector("[data-install-section]") as HTMLElement | null
        section?.scrollIntoView({ behavior: "smooth", block: "start" })
      }
      return
    }

    // GitHub delivery: record purchase/download then show skill modal
    if (isGithub) {
      setLoading(true)
      setError("")
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`)
          return
        }
        // Record the free claim
        const purchaseRes = await fetch(`/api/listings/${listingId}/purchase`, { method: "POST" })
        const purchaseData = await purchaseRes.json()
        if (!purchaseRes.ok && purchaseData.error !== "Failed to record purchase") {
          setError(purchaseData.error ?? "Could not claim skill")
          return
        }
        // Record the download event
        await fetch(`/api/listings/${listingId}/download`, { method: "POST" })
        trackEvent("listing_github_opened", { listing_id: listingId })
        setShowSkillModal(true)
      } catch {
        setError("Something went wrong. Please try again.")
      } finally {
        setLoading(false)
      }
      return
    }

    setLoading(true)
    setError("")

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`)
        return
      }

      if (listingPrice > 0) {
        const purchaseRes = await fetch(`/api/listings/${listingId}/purchase`, { method: "POST" })
        const purchaseData = await purchaseRes.json()

        if (!purchaseRes.ok) {
          setError(purchaseData.error ?? "Purchase failed")
          return
        }

        if (purchaseData.checkoutUrl) {
          trackEvent("listing_purchased", { listing_id: listingId, method: "stripe" })
          window.location.href = purchaseData.checkoutUrl
          return
        }

        if (!purchaseData.alreadyOwned && !purchaseData.success) {
          setError("Purchase could not be completed.")
          return
        }
      } else {
        const purchaseRes = await fetch(`/api/listings/${listingId}/purchase`, { method: "POST" })
        const purchaseData = await purchaseRes.json()

        if (!purchaseRes.ok) {
          setError(purchaseData.error ?? "Could not claim free listing")
          return
        }

        if (purchaseData.success && !purchaseData.alreadyOwned) {
          trackEvent("listing_purchased", { listing_id: listingId, method: "free" })
        }
      }

      const downloadRes = await fetch(`/api/listings/${listingId}/download`, { method: "POST" })
      const downloadData = await downloadRes.json()

      if (!downloadRes.ok) {
        setError(
          getAcquireErrorMessage(downloadData.code, delivery, downloadData.error)
        )
        return
      }

      if (downloadData.downloadUrl) {
        trackEvent("listing_downloaded", { listing_id: listingId })
        window.open(downloadData.downloadUrl, "_blank", "noopener,noreferrer")
      }

      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: listingTitle, url })
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Button
          className="flex-1 h-12 text-base shadow-glow"
          onClick={handlePrimaryAction}
          disabled={loading}
        >
          <ActionIcon className="mr-2 h-5 w-5" />
          {getAcquireButtonLabel({ price: listingPrice, delivery, loading })}
        </Button>
        <BookmarkFlow
          listingId={listingId}
          listingTitle={listingTitle}
          isBookmarked={initialBookmarked}
        />
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 transition-smooth"
          onClick={handleShare}
          aria-label="Share listing"
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </div>
      <AddToCollection listingId={listingId} />
      {githubUrl && !isGithub && (
        <p className="text-xs text-text-tertiary">
          Includes GitHub source:{" "}
          <a href={githubUrl} className="text-cta hover:underline" target="_blank" rel="noreferrer">
            {githubUrl.replace("https://github.com/", "")}
          </a>
        </p>
      )}
      {error && (
        <p className="text-sm text-accent-red bg-accent-red/10 border border-accent-red/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {showSkillModal && (
        <SkillModal
          listingId={listingId}
          listingTitle={listingTitle}
          onClose={() => setShowSkillModal(false)}
        />
      )}
    </div>
  )
}
