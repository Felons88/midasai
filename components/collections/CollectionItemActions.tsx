"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface CollectionItemActionsProps {
  collectionId: string
  listingId: string
}

export function CollectionItemActions({ collectionId, listingId }: CollectionItemActionsProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRemove = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/collections/${collectionId}/items?listingId=${listingId}`,
        { method: "DELETE" }
      )
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRemove}
      disabled={loading}
      className="text-text-tertiary hover:text-red-400"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
