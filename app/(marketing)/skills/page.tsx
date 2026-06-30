import { redirect } from "next/navigation"

type SkillsRedirectProps = {
  searchParams?: Promise<{ page?: string; limit?: string }>
}

/** Legacy /skills route — canonical discovery is /explore */
export default async function SkillsRedirectPage({ searchParams }: SkillsRedirectProps) {
  const params = await searchParams
  const qs = new URLSearchParams()
  qs.set("type", "SKILL")
  if (params?.page) qs.set("page", params.page)
  if (params?.limit) qs.set("limit", params.limit)
  redirect(`/explore?${qs.toString()}`)
}
