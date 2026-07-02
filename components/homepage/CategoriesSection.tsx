"use client"

import {
  Sparkles, Code2, Bot, Workflow,
  FileText, Wrench, BookOpen, Lightbulb,
  Palette, Globe, Zap, Database
} from "lucide-react"
import { CategoryCard, type CategoryItem } from "./CategoryCard"
import { SectionHeader } from "./SectionHeader"

const CATEGORY_DEFINITIONS: Omit<CategoryItem, "count">[] = [
  { slug: "claude-skills", label: "Claude Code Skills", icon: Sparkles, gradient: "linear-gradient(135deg, rgba(202, 138, 4, 0.2), rgba(234, 179, 8, 0.05))", description: "Skills purpose-built for Claude Code" },
  { slug: "cursor-rules", label: "Cursor Rules", icon: Code2, gradient: "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.05))", description: "Context and conventions for Cursor" },
  { slug: "ai-agents", label: "AI Agents", icon: Bot, gradient: "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(124, 58, 237, 0.05))", description: "Autonomous agents for any task" },
  { slug: "workflow-templates", label: "Workflow Templates", icon: Workflow, gradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.05))", description: "Reusable multi-step workflows" },
  { slug: "prompt-packs", label: "Prompt Packs", icon: Lightbulb, gradient: "linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.05))", description: "Curated prompt libraries" },
  { slug: "memory-systems", label: "Memory Systems", icon: Database, gradient: "linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(3, 105, 161, 0.05))", description: "Long-term context and memory packs" },
  { slug: "architect-blueprints", label: "Architect Blueprints", icon: FileText, gradient: "linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(147, 51, 234, 0.05))", description: "AI-generated project blueprints" },
  { slug: "documentation-templates", label: "Documentation", icon: BookOpen, gradient: "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(67, 56, 202, 0.05))", description: "README, spec, and doc templates" },
  { slug: "development-tools", label: "Development Tools", icon: Wrench, gradient: "linear-gradient(135deg, rgba(100, 116, 139, 0.2), rgba(71, 85, 105, 0.05))", description: "IDE plugins, CLI tools, and helpers" },
  { slug: "frontend", label: "Frontend", icon: Palette, gradient: "linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(219, 39, 119, 0.05))", description: "UI, design, and frontend skills" },
  { slug: "devops", label: "DevOps", icon: Globe, gradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.05))", description: "CI/CD, cloud, and infrastructure" },
  { slug: "automation", label: "Automation", icon: Zap, gradient: "linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(147, 51, 234, 0.05))", description: "Automation and productivity boosts" },
]

export function CategoriesSection({ counts }: { counts: Record<string, number> }) {
  const categories: CategoryItem[] = CATEGORY_DEFINITIONS.map((cat) => ({
    ...cat,
    count: counts[cat.slug] || 0,
  }))

  return (
    <section className="py-16 md:py-20 relative">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            badge="Browse"
            title="Explore every category"
            description="Find the exact AI asset for your stack, role, or workflow."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category, index) => (
              <CategoryCard key={category.slug} category={category} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
