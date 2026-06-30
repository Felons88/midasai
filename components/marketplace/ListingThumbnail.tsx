import {
  Bot,
  FileCode,
  GitBranch,
  Package,
  Server,
  Sparkles,
  Workflow,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

const TYPE_ICONS: Record<string, LucideIcon> = {
  SKILL: Sparkles,
  MCP: Server,
  AGENT: Bot,
  WORKFLOW: Workflow,
  PLUGIN: Package,
  PROMPT: FileCode,
  TEMPLATE: FileCode,
  RULE: GitBranch,
}

const TYPE_GRADIENTS: Record<string, string> = {
  SKILL: "from-amber-500/25 to-amber-600/5",
  MCP: "from-violet-500/25 to-violet-600/5",
  AGENT: "from-cyan-500/25 to-cyan-600/5",
  WORKFLOW: "from-emerald-500/25 to-emerald-600/5",
  PLUGIN: "from-blue-500/25 to-blue-600/5",
  PROMPT: "from-pink-500/25 to-pink-600/5",
  TEMPLATE: "from-slate-500/25 to-slate-600/5",
  RULE: "from-orange-500/25 to-orange-600/5",
}

type ListingThumbnailProps = {
  imageUrl?: string | null
  title: string
  type?: string | null
  className?: string
  iconClassName?: string
}

export function ListingThumbnail({
  imageUrl,
  title,
  type = "SKILL",
  className,
  iconClassName,
}: ListingThumbnailProps) {
  const normalizedType = (type ?? "SKILL").toUpperCase()
  const Icon = TYPE_ICONS[normalizedType] ?? Sparkles
  const gradient = TYPE_GRADIENTS[normalizedType] ?? TYPE_GRADIENTS.SKILL

  if (imageUrl) {
    return (
      <div className={cn("overflow-hidden bg-surface", className)}>
        <img
          src={imageUrl}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gradient-to-br border border-white/[0.06]",
        gradient,
        className
      )}
      aria-hidden
    >
      <div className="flex flex-col items-center gap-2 text-center px-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black/20 border border-white/10">
          <Icon className={cn("h-6 w-6 text-cta", iconClassName)} />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">
          {normalizedType.replace(/_/g, " ")}
        </span>
      </div>
    </div>
  )
}
