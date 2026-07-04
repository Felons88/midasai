"use client"

import { useState, useMemo } from "react"
import { Puzzle, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NODE_REGISTRY, CATEGORY_META, searchNodes, type NodeCategory } from "@/lib/nexus/node-registry"
import { BrandIcon } from "./BrandIcon"

const ALL_CATS = ["all", ...Object.keys(CATEGORY_META)] as const

export function NodeLibrary() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const visible = useMemo(() => {
    let nodes = searchQuery.trim() ? searchNodes(searchQuery) : NODE_REGISTRY
    if (selectedCategory !== "all") nodes = nodes.filter(n => n.category === selectedCategory)
    return nodes
  }, [searchQuery, selectedCategory])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Node Library</h2>
          <p className="text-xs text-white/30 mt-0.5">{NODE_REGISTRY.length} nodes available</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <Input
          placeholder="Search nodes…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-white/[0.02] border-white/[0.06] text-white placeholder:text-white/40"
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {ALL_CATS.slice(0, 10).map((cat) => {
          const meta = cat === "all" ? null : CATEGORY_META[cat as NodeCategory]
          return (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="capitalize text-xs"
            >
              {meta ? meta.label : "All"}
            </Button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {visible.map((node) => (
          <div
            key={node.id}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-white/[0.12] transition-all cursor-default group"
          >
            <div className="flex items-start gap-3 mb-3">
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 text-base font-bold"
                style={{ background: node.color + "20", color: node.color }}
              >
                {node.icon.length === 1
                  ? <span style={{ fontSize: 18 }}>{node.icon}</span>
                  : <BrandIcon brand={node.icon} size={22} />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white mb-0.5">{node.name}</h3>
                <p className="text-xs text-white/40 line-clamp-2">{node.description}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/30 capitalize px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.05]">
                {CATEGORY_META[node.category]?.label ?? node.category}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/20">{node.inputs.length} in · {node.outputs.length} out</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="text-center py-14 rounded-2xl border border-dashed border-white/[0.08]">
          <Puzzle className="h-10 w-10 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">No nodes found</p>
        </div>
      )}
    </div>
  )
}
