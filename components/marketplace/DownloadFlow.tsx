"use client"

import { useState, useEffect } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, CheckCircle, ExternalLink, FileText } from "lucide-react"

interface DownloadFlowProps {
  listingId: string
  listingTitle: string
  listingPrice: number
  downloadUrl?: string
  fileSize?: string
  fileFormat?: string
}

export function DownloadFlow({
  listingId,
  listingTitle,
  listingPrice,
  downloadUrl,
  fileSize = "Unknown",
  fileFormat = "Unknown",
}: DownloadFlowProps) {
  const [loading, setLoading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const [supabase] = useState(() => createBrowserSupabaseClient())

  const handleDownload = async () => {
    setLoading(true)
    setError("")

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Store current URL for redirect after login
        const currentPath = window.location.pathname
        router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`)
        return
      }

      // Check if user has purchased this item
      if (listingPrice > 0) {
        const { data: purchase } = await supabase
          .from('purchases')
          .select('*')
          .eq('user_id', user.id)
          .eq('listing_id', listingId)
          .eq('status', 'completed')
          .single()

        if (!purchase) {
          setError("You need to purchase this item before downloading.")
          return
        }
      }

      // Record download
      await supabase
        .from('downloads')
        .insert({
          user_id: user.id,
          listing_id: listingId,
          created_at: new Date().toISOString()
        })

      // Initiate download
      if (downloadUrl) {
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = `${listingTitle}.${fileFormat.toLowerCase()}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      setDownloaded(true)

    } catch (err) {
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
          <CardTitle className="text-xl">Download Started!</CardTitle>
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
              <a href={`/listings/${listingId}`}>
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
        <CardTitle>Download {listingTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
          <div>
            <p className="font-medium">{listingTitle}</p>
            <p className="text-sm text-text-tertiary">
              {fileSize} • {fileFormat}
            </p>
          </div>
          <Download className="h-5 w-5 text-text-tertiary" />
        </div>

        {listingPrice > 0 && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-sm text-amber-500">
              This is a paid item. You&apos;ll need to purchase it before downloading.
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        <Button 
          onClick={handleDownload}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? "Processing..." : listingPrice > 0 ? "Purchase & Download" : "Download Now"}
        </Button>

        <p className="text-xs text-text-tertiary text-center">
          You&apos;ll be redirected to login if needed, then returned here to download.
        </p>
      </CardContent>
    </Card>
  )
}
