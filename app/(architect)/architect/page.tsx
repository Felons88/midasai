import type { Metadata } from "next"
import { ArchitectClient } from "./ArchitectClient"

export const metadata: Metadata = {
  title: "Midas Architect | Design Your AI Project",
  description: "Transform your idea into a complete AI project architecture. Midas Architect guides you through discovery, designs agents and workflows, then generates your project files.",
  openGraph: {
    title: "Midas Architect — Build Complete AI Systems",
    description: "AI-powered project architecture designer. From idea to complete AI system in minutes.",
  },
}

export default function ArchitectPage() {
  return <ArchitectClient />
}
