"use client"

import { useState } from "react"
import { Search, Plus, Loader2, Wand2, CheckCircle2, AlertCircle, Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { NodeDefinition } from "@/lib/nexus/node-registry"

type DiscoveredNode = {
  type: string
  sample: object
  generated?: NodeDefinition
  status: "pending" | "saving" | "saved" | "error"
  error?: string
}

export function NodeDiscoveryTool() {
  const [jsonText, setJsonText] = useState("")
  const [busy, setBusy] = useState(false)
  const [discovered, setDiscovered] = useState<DiscoveredNode[]>([])
  const [error, setError] = useState<string | null>(null)
  const [savedCount, setSavedCount] = useState(0)

  const handleScan = async () => {
    setError(null)
    setDiscovered([])
    setSavedCount(0)

    let n8nWorkflow: object
    try {
      n8nWorkflow = JSON.parse(jsonText)
    } catch {
      setError("Invalid JSON")
      return
    }

    setBusy(true)
    try {
      const res = await fetch("/api/admin/nexus/discover-nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ n8nWorkflow, generate: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Scan failed")

      const nodes: DiscoveredNode[] = (data.unknownTypes as string[]).map((type) => ({
        type,
        sample: data.samples?.[type] || {},
        generated: data.generated?.[type],
        status: "pending",
      }))
      setDiscovered(nodes)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed")
    } finally {
      setBusy(false)
    }
  }

  const handleAdd = async (node: DiscoveredNode) => {
    if (!node.generated) return
    setDiscovered((prev) =>
      prev.map((n) => (n.type === node.type ? { ...n, status: "saving" } : n))
    )

    try {
      const res = await fetch("/api/admin/nexus/custom-nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ n8nType: node.type, definition: node.generated }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Save failed")

      setDiscovered((prev) =>
        prev.map((n) => (n.type === node.type ? { ...n, status: "saved" } : n))
      )
      setSavedCount((c) => c + 1)
    } catch (err) {
      setDiscovered((prev) =>
        prev.map((n) =>
          n.type === node.type ? { ...n, status: "error", error: err instanceof Error ? err.message : "Save failed" } : n
        )
      )
    }
  }

  const handleAddAll = async () => {
    const pending = discovered.filter((n) => n.generated && n.status === "pending")
    for (const node of pending) {
      await handleAdd(node)
    }
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      <div className="border-b border-white/[0.06] px-5 py-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
          <Cpu className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">Node Discovery</h3>
          <p className="text-xs text-white/45">
            Scan an n8n workflow JSON and generate missing Nexus node definitions
          </p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <p className="text-sm text-white/55 leading-relaxed">
          Paste an n8n workflow JSON below. The tool will detect any node types that are not in the Nexus registry and use AI to generate a placeholder node definition for each one.
        </p>

        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder="Paste n8n workflow JSON here..."
          className="w-full h-40 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-violet-500/50 resize-none"
        />

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={handleScan} disabled={busy || !jsonText.trim()}>
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Scan for unknown nodes
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {discovered.length > 0 && (
          <div className="rounded-lg border border-white/[0.06] bg-black/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white">
                {discovered.length} unknown node{discovered.length === 1 ? "" : "s"} found
              </p>
              {discovered.some((n) => n.generated && n.status === "pending") && (
                <Button size="sm" variant="outline" className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10" onClick={handleAddAll}>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Add all
                </Button>
              )}
            </div>

            {savedCount > 0 && (
              <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {savedCount} node{savedCount === 1 ? "" : "s"} added to registry
              </div>
            )}

            <div className="space-y-2">
              {discovered.map((node) => (
                <div
                  key={node.type}
                  className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{node.type}</p>
                    {node.generated ? (
                      <p className="text-xs text-white/45 truncate">
                        {node.generated.name} — {node.generated.description}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-300/70">No AI definition generated</p>
                    )}
                    {node.status === "error" && (
                      <p className="text-xs text-red-300 mt-1">{node.error}</p>
                    )}
                  </div>
                  <div className="ml-4">
                    {node.status === "saved" ? (
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/10 text-white/70 hover:text-white hover:bg-white/[0.06]"
                        disabled={!node.generated || node.status === "saving"}
                        onClick={() => handleAdd(node)}
                      >
                        {node.status === "saving" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                        <span className="ml-1.5">Add</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
