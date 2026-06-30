import Link from "next/link"
import { MessageSquare, HelpCircle, Terminal, ArrowLeft, Tags, FileText, Image } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { href: "reviews", label: "Review Responses", icon: MessageSquare },
  { href: "faq", label: "FAQ", icon: HelpCircle },
  { href: "install", label: "Install Commands", icon: Terminal },
  { href: "tags", label: "Tags", icon: Tags },
  { href: "docs", label: "Documentation", icon: FileText },
  { href: "media", label: "Gallery", icon: Image },
] as const

interface ListingSubnavProps {
  listingId: string
  listingTitle: string
  active: (typeof tabs)[number]["href"]
}

export function ListingSubnav({ listingId, listingTitle, active }: ListingSubnavProps) {
  return (
    <div className="mb-8 space-y-4 animate-fade-in-up">
      <ButtonBack listingId={listingId} />
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary">{listingTitle}</h1>
        <p className="text-text-secondary mt-1">Manage listing content and buyer support</p>
      </div>
      <nav className="flex flex-wrap gap-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = active === href
          return (
            <Link
              key={href}
              href={`/creator/listings/${listingId}/${href}`}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-smooth border",
                isActive
                  ? "bg-cta/10 text-cta border-cta/30"
                  : "bg-surface text-text-secondary border-white/10 hover:text-text-primary hover:border-white/20"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

function ButtonBack({ listingId }: { listingId: string }) {
  return (
    <Link
      href="/creator/listings"
      className="inline-flex items-center gap-2 text-sm text-text-tertiary hover:text-text-primary transition-smooth"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to listings
    </Link>
  )
}
