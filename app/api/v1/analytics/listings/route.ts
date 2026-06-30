import type { NextRequest } from "next/server"
import { handleV1AnalyticsListingsGet } from "@/lib/api/v1/analytics"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  return handleV1AnalyticsListingsGet(request)
}
