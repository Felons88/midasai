import Link from "next/link"
import { Star, Download, BadgeCheck, Zap } from "lucide-react"
import { slugifyTag } from "@/lib/listings/tags"

interface ListingHeroProps {
  title: string
  description: string
  type: string
  categoryName?: string | null
  categorySlug?: string | null
  tags?: string[] | null
  price: number
  avgRating: number
  reviewCount: number
  downloads: number
  verified?: boolean
}

const TYPE_GRADIENTS: Record<string, string> = {
  "Claude Skill":      "from-[#6B21A8] via-[#4F1D96] to-[#1e1030]",
  "Cursor Rule":       "from-[#0f4c75] via-[#1b262c] to-[#0a0a12]",
  "Windsurf Workflow": "from-[#064e3b] via-[#052e16] to-[#0a0a12]",
  "MCP Server":        "from-[#7c2d12] via-[#431407] to-[#0a0a12]",
  "AI Agent":          "from-[#1e3a5f] via-[#0f172a] to-[#0a0a12]",
  "Prompt Pack":       "from-[#3b1f5e] via-[#1e0d3b] to-[#0a0a12]",
  "Template":          "from-[#1a2e1a] via-[#0f1f0f] to-[#0a0a12]",
}

const TYPE_ICONS: Record<string, string> = {
  "Claude Skill":      "⚡",
  "Cursor Rule":       "🎯",
  "Windsurf Workflow": "🌊",
  "MCP Server":        "🔌",
  "AI Agent":          "🤖",
  "Prompt Pack":       "📦",
  "Template":          "📋",
}

export function ListingHero({
  title,
  description,
  type,
  categoryName,
  tags,
  price,
  avgRating,
  reviewCount,
  downloads,
  verified,
}: ListingHeroProps) {
  const gradient = TYPE_GRADIENTS[type] ?? "from-[#1a1a2e] via-[#16213e] to-[#0a0a12]"
  const icon = TYPE_ICONS[type] ?? "✦"

  return (
    <div className="rounded-2xl overflow-hidden border border-white/[0.07] shadow-2xl">
      {/* Banner */}
      <div className={`relative bg-gradient-to-br ${gradient} px-6 pt-8 pb-6 md:px-10 md:pt-10`}>
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glow orb */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/[0.03] blur-3xl pointer-events-none" />

        <div className="relative">
          {/* Type + category row */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-white/10 text-white/80 border border-white/10">
              <span>{icon}</span>
              {type}
            </span>
            {categoryName && (
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/50">
                {categoryName}
              </span>
            )}
            {verified && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20">
                <BadgeCheck className="h-3 w-3" />
                Verified
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight mb-3">
            {title}
          </h1>

          {/* Description */}
          <p className="text-base text-white/60 max-w-2xl leading-relaxed mb-5">
            {description}
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xl font-bold text-white">
              {price > 0 ? `$${price}` : (
                <span className="inline-flex items-center gap-1.5 text-emerald-400">
                  <Zap className="h-4 w-4" />
                  Free
                </span>
              )}
            </span>
            <div className="w-px h-4 bg-white/20" />
            <span className="inline-flex items-center gap-1.5 text-sm text-white/60">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {avgRating.toFixed(1)}
              <span className="text-white/30">({reviewCount})</span>
            </span>
            <div className="w-px h-4 bg-white/20" />
            <span className="inline-flex items-center gap-1.5 text-sm text-white/50">
              <Download className="h-3.5 w-3.5" />
              {downloads.toLocaleString()} installs
            </span>
          </div>
        </div>
      </div>

      {/* Tags strip */}
      {tags && tags.length > 0 && (
        <div className="bg-[#0d0d14] border-t border-white/[0.06] px-6 py-3 md:px-10 flex flex-wrap gap-2">
          {tags.slice(0, 12).map((tag) => (
            <Link
              key={tag}
              href={`/search?tag=${encodeURIComponent(slugifyTag(tag))}`}
              className="text-[11px] px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] text-white/40 hover:text-cta hover:border-cta/30 transition-smooth"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
