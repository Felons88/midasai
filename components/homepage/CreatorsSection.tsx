"use client"

import { CreatorCard, type CreatorItem } from "./CreatorCard"
import { SectionHeader } from "./SectionHeader"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function CreatorsSection({ creators }: { creators: CreatorItem[] }) {
  if (creators.length === 0) return null

  return (
    <section className="py-16 md:py-20 relative">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <SectionHeader
              badge="Creators"
              title="Top creators in the community"
              description="Follow the builders shaping the future of AI-assisted development."
              align="left"
              className="mb-0"
            />
            <Link
              href="/creators"
              className="hidden md:inline-flex items-center gap-1 text-sm text-cta hover:text-cta-light transition-smooth"
            >
              View all creators
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {creators.map((creator, index) => (
              <CreatorCard key={creator.id} creator={creator} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
