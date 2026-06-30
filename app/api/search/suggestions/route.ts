import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, suggestions: [], trending: [] })
    }

    const supabase = await createClient()

    const [titlesResult, tagsResult, categoriesResult, trendingResult] = await Promise.all([
      supabase
        .from("listings")
        .select("title")
        .eq("status", "ACTIVE")
        .ilike("title", `%${query}%`)
        .limit(5),
      supabase
        .from("listings")
        .select("tags")
        .eq("status", "ACTIVE")
        .limit(50),
      supabase
        .from("categories")
        .select("name")
        .ilike("name", `%${query}%`)
        .eq("is_active", true)
        .limit(5),
      supabase
        .from("listings")
        .select("title, tags")
        .eq("status", "ACTIVE")
        .order("views", { ascending: false, nullsFirst: false })
        .limit(10),
    ])

    const suggestions = new Set<string>()

    titlesResult.data?.forEach((item) => {
      if (item.title) suggestions.add(item.title)
    })

    tagsResult.data?.forEach((item) => {
      const tags = item.tags as string[] | null
      if (tags) {
        tags.forEach((tag) => {
          if (tag.toLowerCase().includes(query.toLowerCase())) {
            suggestions.add(tag)
          }
        })
      }
    })

    categoriesResult.data?.forEach((item) => {
      if (item.name) suggestions.add(item.name)
    })

    suggestions.add(query)

    const trending = new Set<string>()
    trendingResult.data?.forEach((item) => {
      if (item.title) trending.add(item.title)
      const tags = item.tags as string[] | null
      if (tags && tags.length > 0) trending.add(tags[0])
    })

    return NextResponse.json({
      success: true,
      suggestions: Array.from(suggestions).slice(0, 8),
      trending: Array.from(trending).slice(0, 6),
    })
  } catch (error) {
    console.error("Search suggestions error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to load suggestions" },
      { status: 500 }
    )
  }
}
