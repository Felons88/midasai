import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock"

type DocsSectionProps = {
  title: string
  lead?: React.ReactNode
  code?: {
    title?: string
    language?: string
    code: string
  }
  children?: React.ReactNode
}

export function DocsSection({ title, lead, code, children }: DocsSectionProps) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {lead && <p className="mt-2 max-w-3xl text-sm text-white/60 leading-relaxed">{lead}</p>}
      {code && (
        <div className="mt-4">
          <DocsCodeBlock
            title={code.title}
            language={code.language ?? "bash"}
            code={code.code}
          />
        </div>
      )}
      {children && <div className="mt-4">{children}</div>}
    </section>
  )
}
