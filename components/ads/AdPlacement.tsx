import { shouldShowAdsForSession } from "@/lib/ads/server"
import { GoogleAdSlot } from "@/components/ads/GoogleAdSlot"
import type { AdPlacement } from "@/lib/ads/config"
import { cn } from "@/lib/utils"

type AdPlacementProps = {
  placement: AdPlacement
  className?: string
}

export async function AdPlacement({ placement, className }: AdPlacementProps) {
  const showAds = await shouldShowAdsForSession()
  if (!showAds) return null

  return (
    <div className={cn("container mx-auto px-4", className)}>
      <GoogleAdSlot placement={placement} />
    </div>
  )
}
