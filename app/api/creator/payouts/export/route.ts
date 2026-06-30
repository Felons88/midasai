import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

function csvEscape(value: unknown): string {
  const str = String(value ?? "")
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("id, created_at, status, amount, fee, net_amount, listing_id")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: "Failed to fetch payout data" }, { status: 500 })
  }

  const listingIds = Array.from(
    new Set((transactions ?? []).map((t) => t.listing_id).filter((id): id is string => Boolean(id)))
  )

  let listingTitleMap = new Map<string, string>()
  if (listingIds.length > 0) {
    const { data: listings } = await supabase
      .from("listings")
      .select("id, title")
      .in("id", listingIds)

    listingTitleMap = new Map((listings ?? []).map((l) => [l.id, l.title]))
  }

  const header = [
    "transaction_id",
    "date",
    "status",
    "listing_id",
    "listing_title",
    "gross_amount",
    "platform_fee",
    "net_amount",
  ]

  const rows = (transactions ?? []).map((t) => [
    t.id,
    t.created_at ?? "",
    t.status ?? "",
    t.listing_id ?? "",
    t.listing_id ? listingTitleMap.get(t.listing_id) ?? "" : "",
    Number(t.amount ?? 0).toFixed(2),
    Number(t.fee ?? 0).toFixed(2),
    Number(t.net_amount ?? 0).toFixed(2),
  ])

  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n")
  const filename = `midasai-payouts-${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}

