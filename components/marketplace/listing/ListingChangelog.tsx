import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { History } from "lucide-react"

export type ListingVersion = {
  id: string
  version_name: string
  version_number: number
  changelog: string | null
  created_at: string | null
  file_size: number | null
}

interface ListingChangelogProps {
  versions: ListingVersion[]
}

export function ListingChangelog({ versions }: ListingChangelogProps) {
  if (!versions.length) {
    return (
      <p className="text-sm text-text-tertiary py-4">No version history published yet.</p>
    )
  }

  return (
    <div className="space-y-4">
      {versions.map((version) => (
        <div
          key={version.id}
          className="rounded-xl border border-white/10 bg-surface/50 p-4"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="font-semibold text-text-primary flex items-center gap-2">
              <History className="h-4 w-4 text-cta" />
              {version.version_name}
              <span className="text-xs text-text-tertiary font-normal">
                v{version.version_number}
              </span>
            </p>
            {version.created_at && (
              <span className="text-xs text-text-tertiary">
                {new Date(version.created_at).toLocaleDateString()}
              </span>
            )}
          </div>
          {version.changelog ? (
            <p className="text-sm text-text-secondary whitespace-pre-wrap">{version.changelog}</p>
          ) : (
            <p className="text-sm text-text-tertiary">No changelog notes.</p>
          )}
          {version.file_size != null && version.file_size > 0 && (
            <p className="text-xs text-text-tertiary mt-2">
              Package size: {(version.file_size / 1024).toFixed(1)} KB
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
