import type { NextRequest } from "next/server"
import {
  handleV1ListingByIdDelete,
  handleV1ListingByIdGet,
  handleV1ListingByIdPut,
} from "@/lib/api/v1/listings"

export const runtime = "nodejs"

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  return handleV1ListingByIdGet(request, id)
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  return handleV1ListingByIdPut(request, id)
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  return handleV1ListingByIdDelete(request, id)
}
