import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

async function getFollowers(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("follows")
    .select(
      `
      id,
      created_at,
      follower:users!follows_follower_id_fkey(
        id,
        name,
        email,
        avatar_url,
        bio
      )
    `
    )
    .eq("following_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Followers fetch error:", error)
    return []
  }

  return data ?? []
}

export default async function CreatorFollowersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const followers = await getFollowers(user.id)

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Followers</h1>
        <p className="text-white/50 text-sm">
          People who follow your creator profile and get notified when you publish.
        </p>
      </div>

      <Card className="glass border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-text-primary flex items-center gap-2">
            <Users className="h-5 w-5 text-cta" />
            {followers.length} {followers.length === 1 ? "follower" : "followers"}
          </CardTitle>
          <CardDescription>Most recent first</CardDescription>
        </CardHeader>
        <CardContent>
          {followers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
              <p className="text-text-secondary mb-2">No followers yet</p>
              <p className="text-sm text-text-tertiary mb-6">
                Share your public creator profile to grow your audience.
              </p>
              <Button asChild variant="outline">
                <Link href="/creator/listings">View your listings</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {followers.map((row) => {
                const follower = row.follower as {
                  id: string
                  name: string | null
                  email: string
                  avatar_url: string | null
                  bio: string | null
                } | null
                const displayName = follower?.name || follower?.email || "User"
                return (
                  <li
                    key={row.id}
                    className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="h-11 w-11 rounded-full bg-white/[0.06] overflow-hidden flex-shrink-0">
                      {follower?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={follower.avatar_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-sm font-medium text-white/40">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {displayName}
                      </p>
                      {follower?.bio && (
                        <p className="text-xs text-text-tertiary truncate">{follower.bio}</p>
                      )}
                      <p className="text-[11px] text-text-tertiary mt-0.5">
                        Followed{" "}
                        {row.created_at
                          ? new Date(row.created_at).toLocaleDateString()
                          : "recently"}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
