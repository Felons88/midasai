"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, ExternalLink, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { DOCS_NAV } from "@/lib/docs/navigation"
import { getApiUrl, getDocsUrl, getSiteUrl } from "@/lib/site-url"
import { DocsPager } from "@/components/docs/DocsPager"

type DocsShellProps = {
  children: React.ReactNode
  title?: string
  description?: string
}

export function DocsShell({ children, title, description }: DocsShellProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const apiUrl = getApiUrl()
  const docsUrl = getDocsUrl()
  const siteUrl = getSiteUrl()

  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#07070b]/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-md p-2 text-white/70 hover:bg-white/[0.06] lg:hidden"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href="https://docs.midasai.tech/" className="flex items-center gap-2 font-semibold">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500 text-xs font-bold text-black">
                M
              </span>
              <span className="hidden sm:inline">MidasAI Docs</span>
            </Link>
            <span className="hidden rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300 md:inline">
              v1
            </span>
          </div>

          <div className="hidden flex-1 items-center justify-center md:flex">
            <div className="flex w-full max-w-md items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-sm text-white/40">
              <Search className="h-4 w-4 shrink-0" />
              <span>Search docs — use sidebar navigation</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <a
              href={apiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1 rounded-md px-2 py-1 text-white/60 hover:text-white sm:flex"
            >
              API
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <Link
              href="/developer"
              className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-400"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px]">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-72 transform border-r border-white/[0.08] bg-[#0a0a10] pt-14 transition-transform lg:static lg:translate-x-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <nav className="h-[calc(100vh-3.5rem)] overflow-y-auto p-4">
            {DOCS_NAV.map((section) => (
              <div key={section.title} className="mb-6">
                <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-white/40">
                  {section.title}
                </p>
                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    const itemPath = item.href.replace(/^https:\/\/docs\.midasai\.tech/, "") || "/"
                    const internalPath = itemPath === "/" ? "/docs" : `/docs${itemPath}`
                    const active =
                      pathname === itemPath ||
                      pathname === internalPath ||
                      (itemPath !== "/" && pathname.startsWith(itemPath.split("#")[0])) ||
                      (itemPath !== "/" && pathname.startsWith(internalPath.split("#")[0]))
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "block rounded-md px-2 py-1.5 text-sm transition-colors",
                            active
                              ? "bg-amber-500/15 text-amber-300"
                              : "text-white/65 hover:bg-white/[0.04] hover:text-white"
                          )}
                        >
                          {item.title}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}

            <div className="mt-4 rounded-lg border border-white/[0.08] bg-white/[0.02] p-3 text-xs text-white/50">
              <p className="mb-1 font-medium text-white/70">Base URL</p>
              <code className="break-all text-amber-300">{apiUrl}</code>
              <p className="mt-3 mb-1 font-medium text-white/70">Docs URL</p>
              <code className="break-all text-amber-300">{docsUrl}</code>
              <p className="mt-3 mb-1 font-medium text-white/70">Marketplace</p>
              <a href={siteUrl} className="text-amber-300 hover:underline">
                {siteUrl}
              </a>
            </div>
          </nav>
        </aside>

        {mobileOpen && (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/60 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          />
        )}

        <main className="min-w-0 flex-1">
          {(title || description) && (
            <div className="border-b border-white/[0.06] px-6 py-8 lg:px-10">
              {title && <h1 className="text-3xl font-bold tracking-tight">{title}</h1>}
              {description && (
                <p className="mt-2 max-w-3xl text-base text-white/60">{description}</p>
              )}
            </div>
          )}
          <div className="px-6 py-8 lg:px-10">
            {children}
            <DocsPager />
          </div>
        </main>
      </div>
    </div>
  )
}
