import type { NextRequest } from "next/server"
import { handleV1UserByIdGet } from "@/lib/api/v1/users"

export const runtime = "nodejs"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return handleV1UserByIdGet(request, id)
}
