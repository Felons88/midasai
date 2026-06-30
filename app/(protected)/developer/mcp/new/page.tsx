import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { CreateMcpServerForm } from "@/components/developers/CreateMcpServerForm"
import { getSiteUrl } from "@/lib/site-url"

export default function NewMcpServerPage() {
  const appUrl = getSiteUrl()

  return (
    <div className="p-6 max-w-2xl">
      <Link
        href="/developer/mcp"
        className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        MCP servers
      </Link>
      <h1 className="text-2xl font-bold text-white mb-1">Connect MCP server</h1>
      <p className="text-sm text-white/50 mb-6">
        Expose role-scoped account context to LLM clients via{" "}
        <code className="text-amber-400/80">{appUrl}/api/mcp</code>. Tokens only return data
        your account role is allowed to see.
      </p>
      <CreateMcpServerForm />
    </div>
  )
}
