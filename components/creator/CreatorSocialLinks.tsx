import Link from "next/link"
import { Github, Globe, Linkedin, Twitter } from "lucide-react"

interface CreatorSocialLinksProps {
  website?: string | null
  githubUsername?: string | null
  twitterUsername?: string | null
  linkedinUrl?: string | null
  discordUrl?: string | null
}

export function CreatorSocialLinks({
  website,
  githubUsername,
  twitterUsername,
  linkedinUrl,
  discordUrl,
}: CreatorSocialLinksProps) {
  const links = [
    website ? { href: website, label: "Website", icon: Globe } : null,
    githubUsername
      ? {
          href: `https://github.com/${githubUsername}`,
          label: "GitHub",
          icon: Github,
        }
      : null,
    twitterUsername
      ? {
          href: `https://twitter.com/${twitterUsername.replace(/^@/, "")}`,
          label: "Twitter",
          icon: Twitter,
        }
      : null,
    linkedinUrl ? { href: linkedinUrl, label: "LinkedIn", icon: Linkedin } : null,
    discordUrl ? { href: discordUrl, label: "Discord", icon: Globe } : null,
  ].filter(Boolean) as { href: string; label: string; icon: typeof Globe }[]

  if (links.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-surface/50 px-3 py-1.5 text-xs text-text-secondary hover:text-cta hover:border-cta/30 transition-smooth"
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </Link>
      ))}
    </div>
  )
}
