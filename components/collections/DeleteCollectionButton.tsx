"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface DeleteCollectionButtonProps {
  collectionId: string
}

export function DeleteCollectionButton({ collectionId }: DeleteCollectionButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm("Delete this collection? Listings will not be removed from bookmarks.")) return

    setLoading(true)
    try {
      const res = await fetch(`/api/collections/${collectionId}`, { method: "DELETE" })
      if (res.ok) {
        router.push("/collections")
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
      className="gap-2 text-red-400 border-red-400/30 hover:bg-red-400/10"
    >
      <Trash2 className="h-4 w-4" />
      {loading ? "Deleting…" : "Delete"}
    </Button>
  )
}
