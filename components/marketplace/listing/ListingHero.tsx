"use client"

import Link from "next/link"
import {
  Star,
  Download,
  BadgeCheck,
  Zap,
  Sparkles,
  Eye,
  TrendingUp,
  ArrowUpRight,
  Cpu,
  Code2,
  Bot,
  Workflow,
  Lightbulb,
  BookOpen,
  Layers,
  FileText,
  type LucideIcon,
} from "lucide-react"
import { AnimatedCounter } from "@/components/homepage/AnimatedCounter"
import { slugifyTag } from "@/lib/listings/tags"
import { cn } from "@/lib/utils"

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
  views?: number
  verified?: boolean
  featured?: boolean
}

const TYPE_META: Record<string, { icon: LucideIcon; gradient: string; emoji: string }> = {
  SKILL: { icon: Code2, gradient: "from-amber-500/30 via-amber-600/10 to-transparent", emoji: "⚡" },
  PLUGIN: { icon: Cpu, gradient: "from-blue-500/30 via-blue-600/10 to-transparent", emoji: "🔌" },
  MCP: { icon: Bot, gradient: "from-orange-500/30 via-orange-600/10 to-transparent", emoji: "🤖" },
  AGENT: { icon: Bot, gradient: "from-purple-500/30 via-purple-600/10 to-transparent", emoji: "🧠" },
  PROMPT: { icon: Lightbulb, gradient: "from-pink-500/30 via-pink-600/10 to-transparent", emoji: "💡" },
  WORKFLOW: { icon: Workflow, gradient: "from-emerald-500/30 via-emerald-600/10 to-transparent", emoji: "🌊" },
  TEMPLATE: { icon: FileText, gradient: "from-indigo-500/30 via-indigo-600/10 to-transparent", emoji: "📋" },
  AUTOMATION: { icon: Zap, gradient: "from-amber-500/30 via-amber-600/10 to-transparent", emoji: "⚡" },
  DEVELOPER_TOOL: { icon: Layers, gradient: "from-slate-500/30 via-slate-600/10 to-transparent", emoji: "�️" },
}

const typeLabel = (type: string) =>
  type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())

export function ListingHero({
  title,
  description,
  type,
  categoryName,
  categorySlug,
  tags,
  price,
  avgRating,
  reviewCount,
  downloads,
  views = 0,
  verified,
  featured,
}: ListingHeroProps) {
  const normalizedType = type.toUpperCase()
  const meta = TYPE_META[normalizedType] ?? { icon: Sparkles, gradient: "from-cta/30 via-cta/10 to-transparent", emoji: "✦" }
  const TypeIcon = meta.icon

  const isFree = price <= 0

  return (
    <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-surface/40 backdrop-blur-xl shadow-2xl">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background: `radial-gradient(circle at 80% 20%, rgba(202, 138, 4, 0.15), transparent 40%),
                         radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.1), transparent 40%)`,
          }}
        />
        <div className={cn("absolute -top-24 -right-24 w-72 h-72 rounded-full blur-[100px] opacity-40 bg-gradient-to-br", meta.gradient)} />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      </div>

      <div className="relative px-6 py-8 md:px-10 md:py-12 lg:px-14">
        <div className="grid lg:grid-cols-5 gap-10 items-center">
          {/* Left content */}
          <div className="lg:col-span-3 space-y-5">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full bg-cta/15 text-cta border border-cta/20">
                <span>{meta.emoji}</span>
                {typeLabel(type)}
              </span>
              {categoryName && (
                <Link
                  href={categorySlug ? `/category/${categorySlug}` : `/search?category=${encodeURIComponent(categoryName)}`}
                  className="text-[11px] px-2.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-cta hover:border-cta/30 transition-smooth"
                >
                  {categoryName}
                </Link>
              )}
              {verified && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 px-2.5 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20">
                  <BadgeCheck className="h-3 w-3" />
                  Verified
                </span>
              )}
              {featured && (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-300 px-2.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                  <TrendingUp className="h-3 w-3" />
                  Featured
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary leading-tight tracking-tight">
              {title}
            </h1>

            {/* Description */}
            <p className="text-base md:text-lg text-text-secondary max-w-2xl leading-relaxed">
              {description}
            </p>

            {/* Quick stats */}
            <div className="flex flex-wrap items-center gap-4 md:gap-6 pt-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-cta/10 flex items-center justify-center">
                  <Star className="h-4 w-4 text-cta" />
                </div>
                <div>
                  <div className="text-lg font-bold text-text-primary leading-none">
                    {avgRating.toFixed(1)}
                  </div>
                  <div className="text-[11px] text-text-tertiary">{reviewCount} reviews</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Download className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-lg font-bold text-text-primary leading-none">
                    <AnimatedCounter value={downloads} />
                  </div>
                  <div className="text-[11px] text-text-tertiary">installs</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Eye className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <div className="text-lg font-bold text-text-primary leading-none">
                    <AnimatedCounter value={views} />
                  </div>
                  <div className="text-[11px] text-text-tertiary">views</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right floating card */}
          <div className="lg:col-span-2">
            <div className="relative">
              <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cta to-cta-light flex items-center justify-center shadow-lg shadow-cta/20">
                    <TypeIcon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-text-primary">
                      {isFree ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-400">
                          <Zap className="h-5 w-5" />
                          Free
                        </span>
                      ) : (
                        `$${price}`
                      )}
                    </div>
                    <div className="text-xs text-text-tertiary">{isFree ? "No credit card" : "One-time purchase"}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-tertiary">Type</span>
                    <span className="text-text-primary font-medium">{typeLabel(type)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-tertiary">Rating</span>
                    <span className="text-text-primary font-medium inline-flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-cta text-cta" />
                      {avgRating.toFixed(1)} ({reviewCount})
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-tertiary">Installs</span>
                    <span className="text-text-primary font-medium">{downloads.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs text-text-tertiary">
                    <span className="inline-flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-cta" />
                      Ready to install
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-cta" />
                  </div>
                </div>
              </div>

              {/* Floating mini badges */}
              <div className="absolute -top-3 -right-3 rounded-full px-3 py-1 text-[10px] font-semibold bg-cta text-primary-foreground shadow-lg shadow-cta/30 animate-float">
                {isFree ? "FREE" : "PAID"}
              </div>
              {verified && (
                <div className="absolute -bottom-2 -left-2 rounded-full px-3 py-1 text-[10px] font-semibold bg-emerald-500 text-white shadow-lg animate-float" style={{ animationDelay: "0.5s" }}>
                  VERIFIED
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tags strip */}
        {tags && tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center gap-2">
            <span className="text-xs text-text-tertiary mr-1">Tags:</span>
            {tags.slice(0, 12).map((tag) => (
              <Link
                key={tag}
                href={`/search?tag=${encodeURIComponent(slugifyTag(tag))}`}
                className="text-[11px] px-3 py-1 rounded-full bg-white/5 border border-white/10 text-text-secondary hover:text-cta hover:border-cta/30 hover:bg-cta/5 transition-smooth"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
