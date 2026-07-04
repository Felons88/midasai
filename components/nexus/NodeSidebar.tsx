"use client"

import { useState, useMemo, useCallback, useRef } from "react"
import { Search, ChevronDown, ChevronRight, Star, Clock, X } from "lucide-react"
import { NODE_REGISTRY, CATEGORY_META, searchNodes, type NodeDefinition, type NodeCategory } from "@/lib/nexus/node-registry"
import { BrandIcon } from "./BrandIcon"
import { cn } from "@/lib/utils"

interface NodeSidebarProps {
  onDragStart: (node: NodeDefinition, e: React.DragEvent) => void
  onAddNode: (node: NodeDefinition) => void
}

const CATEGORY_ORDER: NodeCategory[] = [
  "ai", "image", "audio", "developer", "logic", "data", "database",
  "cloud", "communication", "devops", "files", "midas", "analytics", "crm", "finance",
]

export function NodeSidebar({ onDragStart, onAddNode }: NodeSidebarProps) {
  const [query, setQuery] = useState("")
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set()
    try { return new Set(JSON.parse(localStorage.getItem("nexus_favorites") ?? "[]")) } catch { return new Set() }
  })
  const [recentIds, setRecentIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return []
    try { return JSON.parse(localStorage.getItem("nexus_recent") ?? "[]") } catch { return [] }
  })
  const searchRef = useRef<HTMLInputElement>(null)

  const toggleCollapse = (cat: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  const toggleFavorite = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setFavorites(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      localStorage.setItem("nexus_favorites", JSON.stringify([...next]))
      return next
    })
  }, [])

  const handleAdd = useCallback((node: NodeDefinition) => {
    setRecentIds(prev => {
      const next = [node.id, ...prev.filter(id => id !== node.id)].slice(0, 8)
      localStorage.setItem("nexus_recent", JSON.stringify(next))
      return next
    })
    onAddNode(node)
  }, [onAddNode])

  const handleDragStart = useCallback((node: NodeDefinition, e: React.DragEvent) => {
    setRecentIds(prev => {
      const next = [node.id, ...prev.filter(id => id !== node.id)].slice(0, 8)
      localStorage.setItem("nexus_recent", JSON.stringify(next))
      return next
    })
    onDragStart(node, e)
  }, [onDragStart])

  const grouped = useMemo(() => {
    if (query.trim()) {
      return [{ category: "search" as NodeCategory, nodes: searchNodes(query), label: `Results for "${query}"`, color: "#6b7280" }]
    }
    const byCategory = new Map<string, NodeDefinition[]>()
    for (const node of NODE_REGISTRY) {
      const cat = node.category as string
      if (!byCategory.has(cat)) byCategory.set(cat, [])
      byCategory.get(cat)!.push(node)
    }
    const result = []
    const favNodes = NODE_REGISTRY.filter(n => favorites.has(n.id))
    const recentNodes = recentIds.map(id => NODE_REGISTRY.find(n => n.id === id)).filter(Boolean) as NodeDefinition[]

    if (favNodes.length > 0) result.push({ category: "favorites" as NodeCategory, nodes: favNodes, label: "Favorites", color: "#f59e0b" })
    if (recentNodes.length > 0) result.push({ category: "recent" as NodeCategory, nodes: recentNodes, label: "Recently Used", color: "#6b7280" })

    for (const cat of CATEGORY_ORDER) {
      const nodes = byCategory.get(cat)
      if (nodes?.length) {
        const meta = CATEGORY_META[cat]
        result.push({ category: cat, nodes, label: meta?.label ?? cat, color: meta?.color ?? "#6b7280" })
      }
    }
    return result
  }, [query, favorites, recentIds])

  return (
    <div className="w-[260px] flex-shrink-0 h-full flex flex-col border-r border-white/[0.06] bg-[#0a0a12]">
      {/* Search */}
      <div className="p-3 border-b border-white/[0.06]">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
          <input
            ref={searchRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search nodes…"
            className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg pl-8 pr-7 py-2 text-xs text-white placeholder:text-white/25 outline-none focus:border-white/[0.14] transition-colors"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Node groups */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10">
        {grouped.map(group => {
          const isCollapsed = collapsed.has(group.category)
          const isFavorites = (group.category as string) === "favorites"
          const isRecent = (group.category as string) === "recent"

          return (
            <div key={group.category} className="select-none">
              <button
                onClick={() => toggleCollapse(group.category)}
                className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-semibold tracking-widest uppercase hover:bg-white/[0.03] transition-colors group"
              >
                <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: group.color }} />
                {isFavorites && <Star className="h-3 w-3 text-amber-400" />}
                {isRecent && <Clock className="h-3 w-3 text-white/30" />}
                <span className="flex-1 text-left text-white/30 group-hover:text-white/50 transition-colors">{group.label}</span>
                <span className="text-white/20 text-[9px]">{group.nodes.length}</span>
                {isCollapsed ? <ChevronRight className="h-3 w-3 text-white/20" /> : <ChevronDown className="h-3 w-3 text-white/20" />}
              </button>

              {!isCollapsed && (
                <div className="pb-1">
                  {group.nodes.map(node => (
                    <NodeItem
                      key={node.id}
                      node={node}
                      isFavorite={favorites.has(node.id)}
                      onToggleFavorite={toggleFavorite}
                      onAdd={handleAdd}
                      onDragStart={handleDragStart}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer count */}
      <div className="px-3 py-2 border-t border-white/[0.04]">
        <p className="text-[10px] text-white/20">{NODE_REGISTRY.length} nodes available</p>
      </div>
    </div>
  )
}

interface NodeItemProps {
  node: NodeDefinition
  isFavorite: boolean
  onToggleFavorite: (id: string, e: React.MouseEvent) => void
  onAdd: (node: NodeDefinition) => void
  onDragStart: (node: NodeDefinition, e: React.DragEvent) => void
}

function NodeItem({ node, isFavorite, onToggleFavorite, onAdd, onDragStart }: NodeItemProps) {
  return (
    <div
      draggable
      onDragStart={e => onDragStart(node, e)}
      onClick={() => onAdd(node)}
      className="group mx-2 mb-0.5 flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-grab active:cursor-grabbing hover:bg-white/[0.05] transition-colors"
      title={node.description}
    >
      <div
        className="h-7 w-7 flex-shrink-0 rounded-md flex items-center justify-center text-xs font-bold"
        style={{ background: node.color + "20", color: node.color }}
      >
        {node.icon.length === 1 ? (
          <span style={{ fontSize: 14 }}>{node.icon}</span>
        ) : (
          <BrandIcon brand={node.icon} size={16} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white/80 truncate leading-tight">{node.name}</p>
        <p className="text-[10px] text-white/30 truncate leading-tight mt-0.5">{node.description.slice(0, 45)}{node.description.length > 45 ? "…" : ""}</p>
      </div>
      <button
        onClick={e => onToggleFavorite(node.id, e)}
        className={cn(
          "h-5 w-5 flex-shrink-0 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-all",
          isFavorite ? "opacity-100 text-amber-400" : "text-white/20 hover:text-amber-400"
        )}
      >
        <Star className={cn("h-3 w-3", isFavorite && "fill-amber-400")} />
      </button>
    </div>
  )
}
