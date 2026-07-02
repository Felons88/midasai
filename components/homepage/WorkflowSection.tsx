"use client"

import { SectionHeader } from "./SectionHeader"
import { Brain, FileText, Bot, MessageSquare, Code2, MousePointer2, Wind, GitBranch, MessageCircle, Layers, Zap, CheckCircle2 } from "lucide-react"

const STEPS = [
  {
    icon: Brain,
    label: "Plan",
    description: "Define the outcome with natural language",
    color: "text-cta",
    bg: "bg-cta/10",
  },
  {
    icon: FileText,
    label: "Document",
    description: "Generate specs, runbooks, and READMEs",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Bot,
    label: "Agents",
    description: "Assemble AI agents for each task",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: MessageSquare,
    label: "Prompts",
    description: "Curate prompt packs for every stage",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
  {
    icon: Code2,
    label: "Code",
    description: "Generate and review code with Claude, Cursor, and Codex",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Zap,
    label: "Ship",
    description: "Deploy workflows, templates, and automations",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
]

const TOOLS = [
  { icon: Code2, label: "Claude Code" },
  { icon: MousePointer2, label: "Cursor" },
  { icon: Bot, label: "Codex" },
  { icon: Wind, label: "Windsurf" },
  { icon: MessageCircle, label: "ChatGPT" },
  { icon: Layers, label: "Gemini" },
  { icon: GitBranch, label: "GitHub" },
  { icon: Zap, label: "Automation" },
]

export function WorkflowSection() {
  return (
    <section className="py-16 md:py-20 relative">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            badge="How it works"
            title="Your AI development workflow, connected"
            description="MidasAI unifies the tools you already use into one searchable, installable, and shareable marketplace."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              return (
                <div
                  key={step.label}
                  className="relative p-6 rounded-2xl border border-white/10 bg-surface/40 backdrop-blur-sm hover:border-white/20 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl ${step.bg} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${step.color}`} />
                    </div>
                    <div className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                      Step {index + 1}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">{step.label}</h3>
                  <p className="text-sm text-text-secondary">{step.description}</p>
                </div>
              )
            })}
          </div>

          <div className="rounded-3xl border border-white/10 bg-surface/40 backdrop-blur-sm p-8 md:p-10">
            <div className="text-center mb-8">
              <h3 className="text-xl font-semibold text-text-primary mb-2">Works with your stack</h3>
              <p className="text-sm text-text-secondary">Install skills and rules directly into the AI tools you already use.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {TOOLS.map((tool) => {
                const Icon = tool.icon
                return (
                  <div
                    key={tool.label}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm text-text-secondary hover:text-cta hover:border-cta/30 transition-smooth"
                  >
                    <Icon className="h-4 w-4" />
                    {tool.label}
                  </div>
                )
              })}
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-text-tertiary">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                One-click install
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Versioned assets
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Creator payouts
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
