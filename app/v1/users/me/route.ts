import type { NextRequest } from "next/server"
import { handleV1UsersMeGet, handleV1UsersMePut } from "@/lib/api/v1/users"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  return handleV1UsersMeGet(request)
}

export async function PUT(request: NextRequest) {
  return handleV1UsersMePut(request)
}
