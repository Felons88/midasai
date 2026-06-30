"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FolderPlus } from "lucide-react"

interface CollectionOption {
  id: string
  name: string
}

interface AddToCollectionProps {
  listingId: string
}

export function AddToCollection({ listingId }: AddToCollectionProps) {
  const [collections, setCollections] = useState<CollectionOption[]>([])
  const [selected, setSelected] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetch("/api/collections")
      .then((res) => (res.ok ? res.json() : { collections: [] }))
      .then((data) => {
        setCollections(
          (data.collections ?? []).map((c: { id: string; name: string }) => ({
            id: c.id,
            name: c.name,
          }))
        )
      })
      .catch(() => setCollections([]))
  }, [])

  const handleAdd = async () => {
    if (!selected) return
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch(`/api/collections/${selected}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      })

      if (res.ok) {
        setMessage("Added to collection")
        setTimeout(() => setMessage(""), 2500)
      } else {
        const data = await res.json()
        setMessage(data.error ?? "Failed to add")
      }
    } catch {
      setMessage("Failed to add")
    } finally {
      setLoading(false)
    }
  }

  if (collections.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Add to collection" />
          </SelectTrigger>
          <SelectContent>
            {collections.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={!selected || loading}
          className="gap-1"
        >
          <FolderPlus className="h-4 w-4" />
          Add
        </Button>
      </div>
      {message && <p className="text-xs text-text-tertiary">{message}</p>}
    </div>
  )
}
