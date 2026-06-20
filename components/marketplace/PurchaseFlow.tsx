"use client"

import { useState, useEffect } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Download, ExternalLink } from "lucide-react"

interface PurchaseFlowProps {
  listingId: string
  listingTitle: string
  listingPrice: number
  onPurchaseComplete?: () => void
}

export function PurchaseFlow({
  listingId,
  listingTitle,
  listingPrice,
  onPurchaseComplete,
}: PurchaseFlowProps) {
  const [loading, setLoading] = useState(false)
  const [purchased, setPurchased] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const [supabase] = useState(() => createBrowserSupabaseClient())

  // Check if user is authenticated
  const checkAuthAndPurchase = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // Store purchase intent and redirect to login
      const currentPath = window.location.pathname
      router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`)
      return
    }

    // User is authenticated, proceed with purchase
    await processPurchase(user.id)
  }

  const processPurchase = async (userId: string) => {
    setLoading(true)
    setError("")

    try {
      // Create purchase record
      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: userId,
          listing_id: listingId,
          amount: listingPrice,
          status: 'completed',
          created_at: new Date().toISOString()
        })

      if (purchaseError) {
        setError("Failed to process purchase. Please try again.")
        return
      }

      // Mark as purchased
      setPurchased(true)
      onPurchaseComplete?.()

    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (purchased) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
          <CardTitle className="text-xl">Purchase Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-text-secondary mb-4">
              You now have access to <strong>{listingTitle}</strong>
            </p>
          </div>
          
          <div className="space-y-2">
            <Button asChild className="w-full">
              <a href={`/downloads?listing=${listingId}`}>
                <Download className="h-4 w-4 mr-2" />
                Download Now
              </a>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <a href={`/listings/${listingId}`}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Listing
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
        <CardTitle>Complete Purchase</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold">{listingTitle}</h3>
          <p className="text-2xl font-bold text-cta">${listingPrice}</p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        <Button 
          onClick={checkAuthAndPurchase}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? "Processing..." : "Complete Purchase"}
        </Button>

        <p className="text-xs text-text-tertiary text-center">
          You&apos;ll be redirected to login if needed, then returned here to complete your purchase.
        </p>
      </CardContent>
    </Card>
  )
}
