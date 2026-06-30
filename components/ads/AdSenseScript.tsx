import Script from "next/script"
import { getAdSenseClientId, isAdsConfigured } from "@/lib/ads/config"

export function AdSenseScript() {
  if (!isAdsConfigured()) return null

  const clientId = getAdSenseClientId()!

  return (
    <Script
      id="google-adsense"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  )
}
