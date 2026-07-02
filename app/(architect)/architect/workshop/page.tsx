import type { Metadata } from "next"
import { WorkshopClient } from "./WorkshopClient"

export const metadata: Metadata = {
  title: "Architect | Midas Architect",
  description: "Your AI project architect workshop — expand, manage, and explore generated architectures and project intelligence.",
}

export default function WorkshopPage() {
  return <WorkshopClient />
}
