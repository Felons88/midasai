import { FileText } from "lucide-react"
import { MarkdownContent } from "@/components/marketplace/listing/MarkdownContent"

interface ListingDocumentationProps {
  readme: string | null
  githubUrl?: string | null
}

export function ListingDocumentation({ readme, githubUrl }: ListingDocumentationProps) {
  if (!readme && !githubUrl) {
    return (
      <p className="text-sm text-text-tertiary py-4">No documentation published yet.</p>
    )
  }

  return (
    <div className="space-y-4">
      {githubUrl && (
        <p className="text-sm text-text-secondary">
          Source:{" "}
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className="text-cta hover:underline"
          >
            {githubUrl.replace("https://github.com/", "")}
          </a>
        </p>
      )}
      {readme ? (
        <div className="rounded-xl bg-[#0a0a0f] border border-white/10 p-4">
          <MarkdownContent content={readme} />
        </div>
      ) : (
        <p className="text-sm text-text-tertiary flex items-center gap-2">
          <FileText className="h-4 w-4" />
          See GitHub repository for full documentation.
        </p>
      )}
    </div>
  )
}
