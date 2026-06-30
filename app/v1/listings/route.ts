import type { NextRequest } from "next/server"
import { handleV1ListingsGet, handleV1ListingsPost } from "@/lib/api/v1/listings"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  return handleV1ListingsGet(request)
}

export async function POST(request: NextRequest) {
  return handleV1ListingsPost(request)
}
