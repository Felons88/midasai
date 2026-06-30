"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Terminal, Trash2 } from "lucide-react"

import { INSTALL_PLATFORMS, type InstallPlatform } from "@/lib/install-platforms"
export { INSTALL_PLATFORMS } from "@/lib/install-platforms"
export type { InstallPlatform } from "@/lib/install-platforms"

export interface InstallCommandRow {
  id: string
  platform: InstallPlatform
  command: string
  description: string | null
  prerequisites: string | null
  sort_order: number
}

interface InstallCommandManagerProps {
  listingId: string
  initialCommands: InstallCommandRow[]
}

export function InstallCommandManager({
  listingId,
  initialCommands,
}: InstallCommandManagerProps) {
  const [commands, setCommands] = useState(initialCommands)
  const usedPlatforms = new Set(commands.map((c) => c.platform))
  const availablePlatforms = INSTALL_PLATFORMS.filter((p) => !usedPlatforms.has(p.value))

  const [platform, setPlatform] = useState<InstallPlatform>(availablePlatforms[0]?.value ?? "CURSOR")
  const [command, setCommand] = useState("")
  const [description, setDescription] = useState("")
  const [prerequisites, setPrerequisites] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function saveCommand() {
    if (!command.trim()) {
      setError("Install command is required.")
      return
    }

    setSaving(true)
    setError(null)
    const supabase = createClient()
    const sortOrder =
      commands.length > 0 ? Math.max(...commands.map((c) => c.sort_order)) + 1 : 0

    const { data, error: upsertError } = await supabase
      .from("listing_install_commands")
      .upsert(
        {
          listing_id: listingId,
          platform,
          command: command.trim(),
          description: description.trim() || null,
          prerequisites: prerequisites.trim() || null,
          sort_order: sortOrder,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "listing_id,platform" }
      )
      .select("id, platform, command, description, prerequisites, sort_order")
      .single()

    setSaving(false)

    if (upsertError || !data) {
      setError(upsertError?.message ?? "Failed to save install command.")
      return
    }

    setCommands((prev) => {
      const existing = prev.findIndex((item) => item.platform === data.platform)
      if (existing >= 0) {
        const next = [...prev]
        next[existing] = data
        return next
      }
      return [...prev, data]
    })
    setCommand("")
    setDescription("")
    setPrerequisites("")
  }

  async function deleteCommand(commandId: string) {
    const supabase = createClient()
    const { error: deleteError } = await supabase
      .from("listing_install_commands")
      .delete()
      .eq("id", commandId)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setCommands((prev) => prev.filter((item) => item.id !== commandId))
  }

  const platformLabel = (value: InstallPlatform) =>
    INSTALL_PLATFORMS.find((p) => p.value === value)?.label ?? value

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg text-text-primary flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Add platform install command
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <select
              id="platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as InstallPlatform)}
              className="flex h-10 w-full rounded-lg border bg-surface px-4 py-2 text-sm text-text-primary"
              disabled={availablePlatforms.length === 0}
            >
              {(availablePlatforms.length > 0 ? availablePlatforms : INSTALL_PLATFORMS).map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="command">Command</Label>
            <Textarea
              id="command"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="npx skills add @creator/my-skill"
              rows={3}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Run from your project root"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prerequisites">Prerequisites (optional)</Label>
            <Input
              id="prerequisites"
              value={prerequisites}
              onChange={(e) => setPrerequisites(e.target.value)}
              placeholder="Node.js 18+, Cursor 0.40+"
            />
          </div>
          {error && <p className="text-sm text-accent-red">{error}</p>}
          <Button onClick={saveCommand} disabled={saving || availablePlatforms.length === 0}>
            {saving ? "Saving..." : "Save install command"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {commands.length === 0 ? (
          <Card className="glass">
            <CardContent className="py-10 text-center text-text-secondary">
              No install commands yet. Add one per target platform so buyers know how to use your listing.
            </CardContent>
          </Card>
        ) : (
          commands
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((item) => (
              <Card key={item.id} className="glass">
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold text-cta">
                      {platformLabel(item.platform)}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => deleteCommand(item.id)}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                  <pre className="rounded-lg bg-[#0a0a0f] p-4 text-sm text-green-400 overflow-x-auto">
                    <code>{item.command}</code>
                  </pre>
                  {item.description && (
                    <p className="text-sm text-text-secondary">{item.description}</p>
                  )}
                  {item.prerequisites && (
                    <p className="text-xs text-text-tertiary">
                      Prerequisites: {item.prerequisites}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </div>
  )
}
