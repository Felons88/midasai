import { cn } from "@/lib/utils"

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  POST: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  PUT: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  DELETE: "bg-red-500/15 text-red-300 border-red-500/30",
  PATCH: "bg-purple-500/15 text-purple-300 border-purple-500/30",
}

type DocsEndpointProps = {
  id?: string
  method: string
  path: string
  description: string
  auth?: string
  children?: React.ReactNode
}

export function DocsEndpoint({
  id,
  method,
  path,
  description,
  auth,
  children,
}: DocsEndpointProps) {
  return (
    <section id={id} className="scroll-mt-24 border-b border-white/[0.06] py-8 last:border-0">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span
          className={cn(
            "rounded border px-2 py-0.5 font-mono text-xs font-semibold",
            METHOD_COLORS[method] ?? "bg-white/10 text-white/70 border-white/20"
          )}
        >
          {method}
        </span>
        <code className="font-mono text-sm text-white/90">{path}</code>
        {auth && (
          <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-xs text-white/50">
            Requires {auth}
          </span>
        )}
      </div>
      <p className="mb-4 text-white/65">{description}</p>
      {children}
    </section>
  )
}

type DocsProseProps = {
  children: React.ReactNode
}

export function DocsProse({ children }: DocsProseProps) {
  return (
    <div className="prose prose-invert max-w-none prose-headings:scroll-mt-24 prose-headings:font-semibold prose-a:text-amber-400 prose-code:rounded prose-code:bg-white/[0.06] prose-code:px-1.5 prose-code:py-0.5 prose-code:text-amber-200 prose-pre:bg-transparent prose-pre:p-0">
      {children}
    </div>
  )
}
