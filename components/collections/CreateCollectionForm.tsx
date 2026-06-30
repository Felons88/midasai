"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"

export function CreateCollectionForm() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Failed to create collection")
        return
      }

      setName("")
      setDescription("")
      router.push(`/collections/${data.collection.id}`)
      router.refresh()
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-end">
      <div className="flex-1 w-full space-y-2">
        <Label htmlFor="collection-name" className="text-text-secondary">
          Collection name
        </Label>
        <Input
          id="collection-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My favorite MCP servers"
          maxLength={120}
          required
        />
      </div>
      <div className="flex-1 w-full space-y-2">
        <Label htmlFor="collection-desc" className="text-text-secondary">
          Description (optional)
        </Label>
        <Input
          id="collection-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description"
          maxLength={500}
        />
      </div>
      <Button type="submit" disabled={loading || !name.trim()} className="gap-2 shrink-0">
        <Plus className="h-4 w-4" />
        {loading ? "Creating…" : "New Collection"}
      </Button>
      {error && <p className="text-sm text-red-400 w-full">{error}</p>}
    </form>
  )
}
