import type { NextRequest } from "next/server"
import { handleV1AnalyticsUsageGet } from "@/lib/api/v1/analytics"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  return handleV1AnalyticsUsageGet(request)
}
