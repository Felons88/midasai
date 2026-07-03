import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  BarChart3,
  Users,
  FileText,
  ShieldAlert,
  Receipt,
  CreditCard,
  Wallet,
  FolderOpen,
  Megaphone,
  Settings,
  Wrench,
  Tags,
  Activity,
  Briefcase,
  HardDrive,
  Layers,
  FolderKanban,
} from "lucide-react"

export type AdminNavItem = {
  href: string
  label: string
  icon: LucideIcon
  badge?: number
  section?: string
}

export type AdminNavSection = {
  label: string
  items: AdminNavItem[]
}

export function getAdminNavItems(prefix: string, badges?: Partial<Record<string, number>>): AdminNavItem[] {
  return getAdminNavSections(prefix, badges).flatMap((s) => s.items)
}

export function getAdminNavSections(
  prefix: string,
  badges?: Partial<Record<string, number>>
): AdminNavSection[] {
  return [
    {
      label: "Overview",
      items: [
        { href: `${prefix}/dashboard`, label: "Dashboard", icon: LayoutDashboard },
        { href: `${prefix}/analytics`, label: "Analytics", icon: BarChart3 },
      ],
    },
    {
      label: "People",
      items: [
        { href: `${prefix}/users`, label: "Users", icon: Users },
        { href: `${prefix}/roles`, label: "Roles", icon: ShieldAlert },
        { href: `${prefix}/creators`, label: "Creators", icon: Briefcase },
      ],
    },
    {
      label: "Commerce",
      items: [
        { href: `${prefix}/transactions`, label: "Payments", icon: Receipt },
        { href: `${prefix}/subscriptions`, label: "Subscriptions", icon: CreditCard },
        { href: `${prefix}/payouts`, label: "Payouts", icon: Wallet, badge: badges?.payouts },
      ],
    },
    {
      label: "Content",
      items: [
        { href: `${prefix}/listings`, label: "Listings", icon: FileText, badge: badges?.listings },
        { href: `${prefix}/moderation`, label: "Moderation", icon: ShieldAlert, badge: badges?.moderation },
        { href: `${prefix}/categories`, label: "Categories", icon: Tags },
        { href: `${prefix}/announcements`, label: "Announcements", icon: Megaphone },
      ],
    },
    {
      label: "System",
      items: [
        { href: `${prefix}/health`, label: "System Health", icon: Activity },
        { href: `${prefix}/settings`, label: "Settings", icon: Settings },
      ],
    },
    {
      label: "Tools & Storage",
      items: [
        { href: `${prefix}/files`, label: "Files", icon: HardDrive },
        { href: `${prefix}/projects`, label: "Projects", icon: FolderKanban },
        { href: `${prefix}/tools`, label: "Tools", icon: Wrench },
        { href: `${prefix}/categorization`, label: "Categorization", icon: Layers },
        { href: `${prefix}/communications`, label: "Communications", icon: FolderOpen },
      ],
    },
  ]
}
