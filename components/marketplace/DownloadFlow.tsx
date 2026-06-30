"use client"

import { useState } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getAcquireButtonLabel,
  getAcquireErrorMessage,
  getAcquireSuccessTitle,
  getListingDelivery,
  type ListingDelivery,
} from "@/lib/listings/delivery"
import { Download, CheckCircle, ExternalLink, FileText, Github } from "lucide-react"

interface DownloadFlowProps {
  listingId: string
  listingTitle: string
  listingPrice: number
  fileSize?: string
  fileFormat?: string
  githubUrl?: string | null
  files?: unknown
}

export function DownloadFlow({
  listingId,
  listingTitle,
  listingPrice,
  fileSize = "Unknown",
  fileFormat = "Unknown",
  githubUrl,
  files,
}: DownloadFlowProps) {
  const delivery: ListingDelivery = getListingDelivery(files, githubUrl)
  const isGithub = delivery === "github"
  const ActionIcon = isGithub ? Github : Download
  const [loading, setLoading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const [supabase] = useState(() => createBrowserSupabaseClient())

  const handleDownload = async () => {
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
        if (!purchaseRes.ok) {
          const data = await purchaseRes.json()
          if (data.code !== undefined || purchaseRes.status === 501) {
            setError("Purchase required. Paid checkout is being enabled.")
            return
          }
        }
      }

      const res = await fetch(`/api/listings/${listingId}/download`, { method: "POST" })
      const data = await res.json()

      if (!res.ok) {
        setError(
          getAcquireErrorMessage(data.code, delivery, data.error)
        )
        return
      }

      if (data.downloadUrl) {
        window.open(data.downloadUrl, "_blank", "noopener,noreferrer")
      }

      setDownloaded(true)
    } catch {
      setError("Failed to download. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (downloaded) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
          <CardTitle className="text-xl">{getAcquireSuccessTitle(delivery)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-text-secondary mb-2">
              <strong>{listingTitle}</strong>
            </p>
            <p className="text-sm text-text-tertiary">
              {fileSize} • {fileFormat}
            </p>
          </div>
          <div className="space-y-2">
            <Button variant="outline" asChild className="w-full">
              <a href={`/listing/${listingId}`}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Listing
              </a>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <a href="/downloads">
                <FileText className="h-4 w-4 mr-2" />
                All Downloads
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{isGithub ? "Get on GitHub" : delivery === "install" ? "Install" : "Download"} {listingTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {listingPrice > 0 && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-sm text-amber-500">
              Paid item — purchase will be recorded before download.
            </p>
          </div>
        )}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}
        <Button onClick={handleDownload} disabled={loading} className="w-full" size="lg">
          <ActionIcon className="mr-2 h-5 w-5" />
          {getAcquireButtonLabel({ price: listingPrice, delivery, loading })}
        </Button>
      </CardContent>
    </Card>
  )
}
