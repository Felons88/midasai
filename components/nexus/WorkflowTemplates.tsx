"use client"

import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { WORKFLOW_TEMPLATES, TEMPLATE_CATEGORIES, type WorkflowTemplate } from "@/lib/nexus/workflow-templates"
import { Search, Zap, ChevronRight } from "lucide-react"

interface WorkflowTemplatesProps {
  onUse: (template: WorkflowTemplate) => void
}

const DIFFICULTY_COLORS = {
  beginner: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  intermediate: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  advanced: "text-red-400 bg-red-400/10 border-red-400/20",
}

export function WorkflowTemplates({ onUse }: WorkflowTemplatesProps) {
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const filtered = WORKFLOW_TEMPLATES.filter(t => {
    const matchesSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some(tag => tag.includes(search.toLowerCase()))
    const matchesCategory = !activeCategory || t.category === activeCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Workflow Templates</h2>
          <p className="text-xs text-white/40 mt-0.5">Start with a pre-built workflow and customize it</p>
        </div>
        <span className="text-xs text-white/30">{WORKFLOW_TEMPLATES.length} templates</span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
        <input
          type="text"
          placeholder="Search templates…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder:text-white/25 outline-none focus:border-white/[0.15] transition-colors"
        />
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveCategory(null)}
          className={cn(
            "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
            !activeCategory
              ? "bg-violet-600 text-white"
              : "bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white/80"
          )}
        >
          All
        </button>
        {TEMPLATE_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
              activeCategory === cat
                ? "bg-violet-600 text-white"
                : "bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white/80"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Zap className="h-8 w-8 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30">No templates match your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              isHovered={hoveredId === template.id}
              onHover={setHoveredId}
              onUse={onUse}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TemplateCard({
  template,
  isHovered,
  onHover,
  onUse,
}: {
  template: WorkflowTemplate
  isHovered: boolean
  onHover: (id: string | null) => void
  onUse: (t: WorkflowTemplate) => void
}) {
  const nodeCount = template.definition.nodes.length
  const edgeCount = template.definition.edges.length

  return (
    <div
      className={cn(
        "group relative rounded-2xl border bg-white/[0.02] p-4 cursor-pointer transition-all duration-200",
        isHovered
          ? "border-white/[0.18] bg-white/[0.04] shadow-lg"
          : "border-white/[0.06] hover:border-white/[0.12]"
      )}
      onMouseEnter={() => onHover(template.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onUse(template)}
    >
      {/* Icon + difficulty */}
      <div className="flex items-start justify-between mb-3">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: template.color + "18", border: `1px solid ${template.color}30` }}
        >
          {template.icon}
        </div>
        <span className={cn(
          "text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize",
          DIFFICULTY_COLORS[template.difficulty]
        )}>
          {template.difficulty}
        </span>
      </div>

      {/* Title + description */}
      <h3 className="text-sm font-semibold text-white mb-1">{template.name}</h3>
      <p className="text-xs text-white/40 leading-relaxed mb-3 line-clamp-2">{template.description}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {template.tags.slice(0, 4).map(tag => (
          <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/30 border border-white/[0.05]">
            {tag}
          </span>
        ))}
      </div>

      {/* Footer: node count + CTA */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
        <span className="text-[10px] text-white/25">
          {nodeCount} nodes · {edgeCount} connections
        </span>
        <div className={cn(
          "flex items-center gap-1 text-[11px] font-medium transition-colors",
          isHovered ? "text-violet-400" : "text-white/30 group-hover:text-violet-400"
        )}>
          Use template
          <ChevronRight className="h-3 w-3" />
        </div>
      </div>

      {/* Mini node preview dots */}
      <div className="absolute bottom-3 right-16 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {template.definition.nodes.map((_, i) => (
          <div key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: template.color, opacity: 0.4 + i * 0.15 }} />
        ))}
      </div>
    </div>
  )
}
