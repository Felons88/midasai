import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface MarkdownContentProps {
  content: string
  className?: string
}

export function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  return (
    <div
      className={`prose prose-invert prose-sm max-w-none prose-headings:text-text-primary prose-p:text-text-secondary prose-a:text-cta prose-code:text-cta prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/10 ${className}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}
