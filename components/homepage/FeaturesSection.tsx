"use client"

import { Sparkles, Code2, Bot, Workflow, FileText, Zap, Layers, BookOpen, Cpu, Lightbulb } from "lucide-react"
import { FeatureCard, type FeatureItem } from "./FeatureCard"
import { SectionHeader } from "./SectionHeader"

const FEATURES: FeatureItem[] = [
  {
    title: "Claude Code Skills",
    description: "Purpose-built skills for Claude Code that automate code review, documentation, testing, and refactoring workflows.",
    icon: Code2,
    gradient: "linear-gradient(135deg, rgba(202, 138, 4, 0.15), rgba(234, 179, 8, 0.05))",
    stat: "1,200+",
    statLabel: "Skills",
  },
  {
    title: "Cursor Rules",
    description: "Engineering rules and context files that make Cursor understand your codebase, stack, and conventions instantly.",
    icon: Sparkles,
    gradient: "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.05))",
    stat: "800+",
    statLabel: "Rules",
  },
  {
    title: "AI Agents",
    description: "Autonomous agents for research, code generation, quality assurance, deployment, and infrastructure management.",
    icon: Bot,
    gradient: "linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(124, 58, 237, 0.05))",
    stat: "600+",
    statLabel: "Agents",
  },
  {
    title: "Workflow Templates",
    description: "Production-ready Windsurf and Claude Code workflows that turn complex tasks into repeatable, shareable recipes.",
    icon: Workflow,
    gradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.05))",
    stat: "450+",
    statLabel: "Workflows",
  },
  {
    title: "Prompt Packs",
    description: "Curated prompt libraries for sales, marketing, product, engineering, and creative work across every major model.",
    icon: Lightbulb,
    gradient: "linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(219, 39, 119, 0.05))",
    stat: "2,100+",
    statLabel: "Prompts",
  },
  {
    title: "Memory Systems",
    description: "Long-term memory and context packs that help AI assistants remember your projects, preferences, and domain knowledge.",
    icon: BookOpen,
    gradient: "linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(2, 132, 199, 0.05))",
    stat: "320+",
    statLabel: "Memories",
  },
  {
    title: "Automation Packs",
    description: "Plug-and-play automation sequences for CI/CD, data pipelines, browser automation, and no-code integrations.",
    icon: Zap,
    gradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.05))",
    stat: "540+",
    statLabel: "Packs",
  },
  {
    title: "Documentation Templates",
    description: "README, API doc, runbook, and technical spec templates that make every project look professional from day one.",
    icon: FileText,
    gradient: "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.05))",
    stat: "380+",
    statLabel: "Templates",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            badge="Asset Types"
            title="Every AI development asset in one place"
            description="From code-assistant skills to complete project blueprints, find the exact building blocks your team needs."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
