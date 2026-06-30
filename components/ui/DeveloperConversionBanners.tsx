"use client"

import { UpgradeBanner, StorageWarningBar } from "./UpgradeBanner"

interface DeveloperConversionBannersProps {
  tier: string
  apiUsagePct: number
  storageUsedGb: number
  storageLimitGb: number
  isMonthlySub: boolean
}

export function DeveloperConversionBanners({
  tier,
  apiUsagePct,
  storageUsedGb,
  storageLimitGb,
  isMonthlySub,
}: DeveloperConversionBannersProps) {
  return (
    <div className="flex flex-col gap-3 mb-6">
      {/* Usage warnings first (highest urgency) */}
      <UpgradeBanner
        currentTier={tier}
        usagePct={apiUsagePct}
        variant="warning"
        dismissible
      />

      {/* Storage warning bar */}
      <StorageWarningBar
        usedGb={storageUsedGb}
        limitGb={storageLimitGb}
        tier={tier}
      />

      {/* Annual discount for monthly paid users */}
      {isMonthlySub && tier !== "FREE" && (
        <UpgradeBanner
          currentTier={tier}
          variant="annual"
          dismissible
        />
      )}

      {/* Generic upgrade nudge for free tier with activity */}
      {tier === "FREE" && apiUsagePct < 80 && (
        <UpgradeBanner
          currentTier={tier}
          variant="upgrade"
          dismissible
        />
      )}
    </div>
  )
}
