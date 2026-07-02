"use client"

import Link from "next/link"
import { Sparkles, ArrowRight, Play, Bot, Workflow, FileCode, Layers } from "lucide-react"
import { HeroSearchBox } from "./HeroSearchBox"
import { HeroBackground } from "./HeroBackground"
import { FloatingCard } from "./FloatingCard"

const HERO_TRENDING = [
  "Claude Skills",
  "Cursor Rules",
  "AI Agents",
  "Workflow Templates",
  "Prompt Packs",
  "Automation Packs",
]

export function HeroSection({ totalListings }: { totalListings: number }) {
  return (
    <section className="relative min-h-[75vh] flex items-center justify-center pt-16 pb-12 lg:pt-20 lg:pb-16">
      <HeroBackground />

      {/* Floating cards — positioned at viewport edges, never overlapping content */}
      <div className="hidden 2xl:block pointer-events-none absolute inset-y-0 left-0 right-0 z-[5]">
        <div className="absolute top-1/2 -translate-y-1/2 left-6 xl:left-10 flex flex-col justify-center gap-6">
          <FloatingCard
            icon={Bot}
            title="AI Agent Installed"
            subtitle="Code review agent by @aismith"
            variant="gold"
            delay={0}
            className="w-52"
          />
          <FloatingCard
            icon={FileCode}
            title="Cursor Rule Downloaded"
            subtitle="React architecture rules"
            variant="purple"
            delay={0.6}
            className="w-52"
          />
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 right-6 xl:right-10 flex flex-col justify-center gap-6">
          <FloatingCard
            icon={Workflow}
            title="Workflow Template"
            subtitle="DevOps pipeline for Vercel"
            variant="blue"
            delay={1.2}
            className="w-52"
          />
          <FloatingCard
            icon={Layers}
            title="Prompt Pack Added"
            subtitle="Sales outreach prompts"
            variant="gold"
            delay={1.8}
            className="w-52"
          />
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Announcement badge */}
          {totalListings > 0 ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/80 border border-white/10 mb-8 animate-fade-in-up backdrop-blur-xl">
              <span className="w-2 h-2 rounded-full bg-cta animate-pulse" />
              <span className="text-sm font-medium text-text-secondary">
                {totalListings.toLocaleString()}+ AI assets ready to install
              </span>
              <Sparkles className="h-4 w-4 text-cta" />
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/80 border border-white/10 mb-8 animate-fade-in-up backdrop-blur-xl">
              <span className="w-2 h-2 rounded-full bg-cta animate-pulse" />
              <span className="text-sm font-medium text-text-secondary">Launching soon — join the waitlist</span>
              <Sparkles className="h-4 w-4 text-cta" />
            </div>
          )}

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-text-primary mb-5 leading-[1.05] tracking-tight animate-fade-in-up text-balance">
            The marketplace for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cta via-cta-light to-amber-200">
              AI development
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg md:text-xl text-text-secondary mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in-up text-balance" style={{ animationDelay: "0.05s" }}>
            Discover, install, and sell Claude Skills, Cursor Rules, AI Agents, Workflow Templates, Prompt Packs, and Architect Blueprints.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <Link
              href="/auth/register"
              className="group relative inline-flex items-center gap-2 h-14 px-8 rounded-xl bg-gradient-to-r from-cta to-cta-light text-primary-foreground font-semibold text-base hover:shadow-glow transition-all duration-300 hover:-translate-y-0.5"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 h-14 px-8 rounded-xl border border-white/15 bg-white/5 text-text-primary font-semibold text-base hover:bg-white/10 hover:border-white/25 transition-all duration-300"
            >
              <Play className="h-4 w-4 fill-current" />
              Explore Marketplace
            </Link>
          </div>

          {/* Search */}
          <div className="mb-10 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <HeroSearchBox />
          </div>

          {/* Trending searches */}
          <div className="flex flex-wrap items-center justify-center gap-3 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <span className="text-xs text-text-tertiary mr-1">Trending:</span>
            {HERO_TRENDING.map((term) => (
              <Link
                key={term}
                href={`/search?q=${encodeURIComponent(term)}`}
                className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-text-secondary hover:text-cta hover:border-cta/30 hover:bg-cta/5 transition-smooth"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
