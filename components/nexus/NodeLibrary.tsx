"use client"

import { useState, useEffect } from "react"
import { Cpu, Database, Cloud, GitBranch, Globe, FileCode, BarChart3, Puzzle, Search, Loader2, MonitorCog, Chrome } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { NexusNode, NodeCategory } from "@/lib/nexus/types"

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  ai: Cpu,
  developer: Globe,
  database: Database,
  cloud: Cloud,
  logic: GitBranch,
  files: FileCode,
  midas: Puzzle,
  analytics: BarChart3,
  browser: Chrome,
  ide: MonitorCog,
}

const CATEGORY_COLORS: Record<string, string> = {
  ai: "text-violet-400 bg-violet-500/10",
  developer: "text-blue-400 bg-blue-500/10",
  database: "text-emerald-400 bg-emerald-500/10",
  cloud: "text-cyan-400 bg-cyan-500/10",
  logic: "text-amber-400 bg-amber-500/10",
  files: "text-orange-400 bg-orange-500/10",
  midas: "text-yellow-400 bg-yellow-500/10",
  analytics: "text-pink-400 bg-pink-500/10",
  browser: "text-sky-400 bg-sky-500/10",
  ide: "text-indigo-400 bg-indigo-500/10",
}

const CATEGORIES: (NodeCategory | "all")[] = ["all", "ai", "developer", "database", "cloud", "logic", "files", "midas", "analytics"]

export function NodeLibrary() {
  const [nodes, setNodes] = useState<NexusNode[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<NodeCategory | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetch("/api/nexus/nodes")
      .then((r) => r.json())
      .then((d) => setNodes(d.nodes ?? []))
      .finally(() => setLoading(false))
  }, [])

  const filteredNodes = nodes.filter((node) => {
    const matchesCategory = selectedCategory === "all" || node.category === selectedCategory
    const matchesSearch =
      searchQuery === "" ||
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <Input
          placeholder="Search nodes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-white/[0.02] border-white/[0.06] text-white placeholder:text-white/40"
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {CATEGORIES.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="capitalize"
          >
            {category}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-white/30" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNodes.map((node) => {
              const Icon = CATEGORY_ICONS[node.category] ?? Puzzle
              const colorClass = CATEGORY_COLORS[node.category] ?? "text-white/60 bg-white/[0.04]"
              return (
                <div
                  key={node.id}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-white/[0.12] transition-all cursor-default group"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0", colorClass)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white mb-0.5">{node.name}</h3>
                      <p className="text-xs text-white/40 line-clamp-2">{node.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/30 capitalize px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.05]">
                      {node.category}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-white/30">
                      <span>{node.inputs}↓</span>
                      <span>{node.outputs}↑</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredNodes.length === 0 && (
            <div className="text-center py-14 rounded-2xl border border-dashed border-white/[0.08]">
              <Puzzle className="h-10 w-10 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/30">No nodes found</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
