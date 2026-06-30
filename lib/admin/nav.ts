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
} from "lucide-react"

export type AdminNavItem = {
  href: string
  label: string
  icon: LucideIcon
  badge?: number
}

export function getAdminNavItems(prefix: string, badges?: Partial<Record<string, number>>): AdminNavItem[] {
  return [
    { href: `${prefix}/dashboard`, label: "Overview", icon: LayoutDashboard },
    { href: `${prefix}/analytics`, label: "Analytics", icon: BarChart3 },
    { href: `${prefix}/users`, label: "Users", icon: Users },
    { href: `${prefix}/listings`, label: "Listings", icon: FileText, badge: badges?.listings },
    { href: `${prefix}/moderation`, label: "Moderation", icon: ShieldAlert, badge: badges?.moderation },
    { href: `${prefix}/transactions`, label: "Payments", icon: Receipt },
    { href: `${prefix}/subscriptions`, label: "Subscriptions", icon: CreditCard },
    { href: `${prefix}/payouts`, label: "Payouts", icon: Wallet, badge: badges?.payouts },
    { href: `${prefix}/files`, label: "Files", icon: FolderOpen },
    { href: `${prefix}/tools`, label: "Tools", icon: Wrench },
    { href: `${prefix}/communications`, label: "Communications", icon: Megaphone },
    { href: `${prefix}/settings`, label: "Settings", icon: Settings },
  ]
}
