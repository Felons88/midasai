import type { NextRequest } from "next/server"
import { handleV1WebhooksGet, handleV1WebhooksPost } from "@/lib/api/v1/webhooks"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  return handleV1WebhooksGet(request)
}

export async function POST(request: NextRequest) {
  return handleV1WebhooksPost(request)
}
