"use client"

import { useState, type ReactNode } from "react"

type TabId = "overview" | "install" | "docs" | "changelog" | "faq" | "reviews"

interface Tab {
  id: TabId
  label: string
  content: ReactNode
  hidden?: boolean
}

interface ListingDetailTabsProps {
  tabs: Tab[]
}

export function ListingDetailTabs({ tabs }: ListingDetailTabsProps) {
  const visibleTabs = tabs.filter((t) => !t.hidden)
  const [active, setActive] = useState<TabId>(visibleTabs[0]?.id ?? "overview")

  const activeTab = visibleTabs.find((t) => t.id === active) ?? visibleTabs[0]

  if (visibleTabs.length <= 1) {
    return <div>{activeTab?.content}</div>
  }

  return (
    <div className="space-y-4">
      <div
        className="flex gap-1 overflow-x-auto border-b border-white/10 pb-px"
        role="tablist"
        aria-label="Listing details"
      >
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            id={`listing-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={tab.id === active}
            onClick={() => setActive(tab.id)}
            className={`shrink-0 px-4 py-2.5 text-sm font-medium transition-smooth border-b-2 -mb-px ${
              tab.id === active
                ? "border-cta text-cta"
                : "border-transparent text-text-tertiary hover:text-text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{activeTab?.content}</div>
    </div>
  )
}
