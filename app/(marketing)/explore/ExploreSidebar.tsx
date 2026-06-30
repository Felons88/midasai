"use client"

import Link from "next/link"
import { TrendingUp, Folder, Activity, Sparkles, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type SidebarSkill = {
  id: string
  title: string
  downloads: number
}

type SidebarCategory = {
  id: string
  slug: string
  name: string
  count: number
}

type SidebarActivity = {
  title: string
  action: string
  timeLabel: string
}

type SidebarFeaturedCreator = {
  id: string
  name: string
  slug: string | null
  verified: boolean
  listingCount: number
}

type SidebarStats = {
  totalListings: number
  totalCreators: number
  totalDownloads: number
}

interface ExploreSidebarProps {
  trendingSkills: SidebarSkill[]
  topCategories: SidebarCategory[]
  recentActivity: SidebarActivity[]
  featuredCreator?: SidebarFeaturedCreator
  stats: SidebarStats
}

export function ExploreSidebar({
  trendingSkills,
  topCategories,
  recentActivity,
  featuredCreator,
  stats,
}: ExploreSidebarProps) {

  return (
    <div className="space-y-6">
      {/* Trending Skills */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-cta" />
            Trending Skills
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trendingSkills.map((skill, index) => (
              <Link
                key={skill.id}
                href={`/listing/${skill.id}`}
                className="flex items-center justify-between group hover:bg-white/5 p-2 rounded-lg transition-smooth"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-text-tertiary w-4">{index + 1}</span>
                  <span className="text-sm text-text-primary group-hover:text-cta transition-smooth">
                    {skill.title}
                  </span>
                </div>
                <span className="text-xs text-text-tertiary">{skill.downloads.toLocaleString()}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Categories */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Folder className="h-5 w-5 text-cta" />
            Top Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topCategories.map((category) => (
              <Link
                key={category.id}
                href={`/explore?category=${category.slug}`}
                className="flex items-center justify-between group hover:bg-white/5 p-2 rounded-lg transition-smooth"
              >
                <span className="text-sm text-text-primary group-hover:text-cta transition-smooth">
                  {category.name}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {category.count}
                </Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-cta" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((item, index) => (
              <div key={`${item.title}-${index}`} className="text-sm">
                <p className="text-text-secondary">
                  <span className="text-text-tertiary">{item.action}:</span>{" "}
                  <span className="text-text-primary">{item.title}</span>
                </p>
                <p className="text-xs text-text-tertiary mt-0.5">{item.timeLabel}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Featured Creator */}
      {featuredCreator && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cta" />
              Featured Creator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium text-text-primary">{featuredCreator.name}</p>
              <p className="text-sm text-text-secondary">{featuredCreator.listingCount} active listings</p>
              {featuredCreator.verified && <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/20">Verified</Badge>}
              <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                <Link href={featuredCreator.slug ? `/creator/${featuredCreator.slug}` : `/creators/${featuredCreator.id}`}>
                  View Creator
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Skill CTA */}
      <Card className="glass border-cta/30">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Sparkles className="h-8 w-8 text-cta mx-auto" />
            <h3 className="font-semibold text-text-primary">Create Your Skill</h3>
            <p className="text-sm text-text-secondary">
              Share your AI tools with the community
            </p>
            <Button className="w-full" asChild>
              <Link href="/creator/upload">
                Get Started <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Community Stats */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg">Community Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-text-tertiary">Total Skills</span>
              <span className="text-text-primary font-medium">{stats.totalListings.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-tertiary">Active Creators</span>
              <span className="text-text-primary font-medium">{stats.totalCreators.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-tertiary">Downloads</span>
              <span className="text-text-primary font-medium">{stats.totalDownloads.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
