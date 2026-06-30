import { createClient, createServiceClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { canAccessCreator } from "@/lib/roles"
import { getAuthLoginUrl, getAuthLoginUrlForHost } from "@/lib/site-url"
import { headers } from "next/headers"
import { getSubdomain } from "@/lib/subdomains"

export default async function CreatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const host = (await headers()).get("host")
    const subdomain = getSubdomain(host)
    redirect(
      subdomain === "creator"
        ? getAuthLoginUrlForHost(host, "/")
        : getAuthLoginUrl("/creator/dashboard")
    )
  }

  // Any authenticated user can publish — auto-upgrade role on first studio visit
  const hasAccess = await canAccessCreator(user.id)
  if (!hasAccess) {
    const service = createServiceClient()
    await service.from("users").update({ role: "CREATOR" }).eq("id", user.id)
  }

  return <>{children}</>
}
