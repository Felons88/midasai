import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Terminal, HelpCircle } from "lucide-react"
import { INSTALL_PLATFORMS } from "@/lib/install-platforms"

interface InstallCommand {
  id: string
  platform: string
  command: string
  description: string | null
  prerequisites: string | null
}

interface FaqItem {
  id: string
  question: string
  answer: string
}

interface ListingInstallSectionProps {
  commands: InstallCommand[]
  embedded?: boolean
}

interface ListingFaqSectionProps {
  faqs: FaqItem[]
  embedded?: boolean
}

function platformLabel(value: string) {
  return INSTALL_PLATFORMS.find((p) => p.value === value)?.label ?? value
}

export function ListingInstallSection({ commands, embedded }: ListingInstallSectionProps) {
  if (!commands.length) return null

  const inner = (
    <>
      {!embedded && (
        <CardHeader>
          <CardTitle className="text-2xl text-text-primary flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Installation
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={embedded ? "p-0 space-y-4" : "space-y-4"}>
        {embedded && (
          <p className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-2">
            <Terminal className="h-4 w-4 text-cta" />
            Installation commands
          </p>
        )}
        {commands.map((item) => (
          <div key={item.id} className="space-y-2">
            <p className="text-sm font-semibold text-cta">{platformLabel(item.platform)}</p>
            <pre className="rounded-lg bg-[#0a0a0f] p-4 text-sm text-green-400 overflow-x-auto">
              <code>{item.command}</code>
            </pre>
            {item.description && (
              <p className="text-sm text-text-secondary">{item.description}</p>
            )}
            {item.prerequisites && (
              <p className="text-xs text-text-tertiary">Prerequisites: {item.prerequisites}</p>
            )}
          </div>
        ))}
      </CardContent>
    </>
  )

  if (embedded) return <div>{inner}</div>

  return <Card className="glass">{inner}</Card>
}

export function ListingFaqSection({ faqs, embedded }: ListingFaqSectionProps) {
  if (!faqs.length) return null

  const inner = (
    <>
      {!embedded && (
        <CardHeader>
          <CardTitle className="text-2xl text-text-primary flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={embedded ? "p-0 space-y-4" : "space-y-4"}>
        {embedded && (
          <p className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-2">
            <HelpCircle className="h-4 w-4 text-cta" />
            FAQ
          </p>
        )}
        {faqs.map((faq) => (
          <div key={faq.id} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
            <p className="font-medium text-text-primary">{faq.question}</p>
            <p className="text-sm text-text-secondary mt-2 whitespace-pre-wrap">{faq.answer}</p>
          </div>
        ))}
      </CardContent>
    </>
  )

  if (embedded) return <div>{inner}</div>

  return <Card className="glass">{inner}</Card>
}
