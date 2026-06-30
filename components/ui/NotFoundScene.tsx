"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

const FUNNY_LINES = [
  "This page went to fetch more GPU credits… and never came back.",
  "404: Even our AI couldn't hallucinate this URL into existence.",
  "You found the void. Midas left no gold here.",
  "This route got deprecated faster than a beta model.",
]

export function NotFoundScene() {
  const [phase, setPhase] = useState<"animate" | "reveal">("animate")
  const [line, setLine] = useState(FUNNY_LINES[0])

  useEffect(() => {
    setLine(FUNNY_LINES[Math.floor(Math.random() * FUNNY_LINES.length)])
    const timer = window.setTimeout(() => setPhase("reveal"), 2200)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="flex flex-col min-h-[75vh] items-center justify-center px-4 text-center overflow-hidden">
      <div className="ambient-glow" />

      {/* Animated stage */}
      <div className="relative mb-10 h-44 w-44 sm:h-52 sm:w-52">
        <div className="not-found-orbit absolute inset-0 rounded-full border border-amber-400/20" />
        <div className="not-found-orbit-reverse absolute inset-3 rounded-full border border-dashed border-blue-400/20" />

        <div className="not-found-coin absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-700 shadow-[0_0_40px_rgba(251,191,36,0.35)] flex items-center justify-center">
            <Sparkles className="h-10 w-10 text-amber-950 not-found-sparkle" />
          </div>
        </div>

        <div className="not-found-ghost absolute -right-2 top-2 text-4xl sm:text-5xl select-none">
          👻
        </div>
        <div className="not-found-float absolute -left-3 bottom-4 text-2xl select-none">
          🪙
        </div>
      </div>

      <p className="not-found-glitch text-7xl sm:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 mb-2 relative">
        404
      </p>

      <div
        className={`max-w-lg transition-all duration-700 ease-out relative ${
          phase === "reveal"
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-6 pointer-events-none"
        }`}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-3">
          Page not found
        </h1>
        <p className="text-text-secondary mb-2">{line}</p>
        <p className="text-sm text-text-tertiary mb-8">
          The page you are looking for does not exist or may have been moved.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/">Back to Marketplace</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/search">Search listings</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
