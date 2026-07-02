"use client"

import Link from "next/link"
import { ArrowRight, Sparkles, Upload } from "lucide-react"

export function CTASection() {
  return (
    <section className="py-16 md:py-20 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(202, 138, 4, 0.08), transparent 55%)",
        }}
      />
      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/80 border border-white/10 mb-6">
            <Sparkles className="h-4 w-4 text-cta" />
            <span className="text-sm font-medium text-text-secondary">Join the AI development marketplace</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4 tracking-tight">
            Start building with AI assets today
          </h2>
          <p className="text-lg text-text-secondary mb-10 max-w-2xl mx-auto">
            Discover skills that make your AI assistants work harder, or publish your own and earn every time someone installs them.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="group inline-flex items-center gap-2 h-14 px-8 rounded-xl bg-gradient-to-r from-cta to-cta-light text-primary-foreground font-semibold text-base hover:shadow-glow transition-all duration-300 hover:-translate-y-0.5"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/creator/upload"
              className="inline-flex items-center gap-2 h-14 px-8 rounded-xl border border-white/15 bg-white/5 text-text-primary font-semibold text-base hover:bg-white/10 hover:border-white/25 transition-all duration-300"
            >
              <Upload className="h-4 w-4" />
              Upload Your First Asset
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
