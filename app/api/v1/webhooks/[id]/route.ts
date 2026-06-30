import type { NextRequest } from "next/server"
import { handleV1WebhookDelete } from "@/lib/api/v1/webhooks"

export const runtime = "nodejs"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return handleV1WebhookDelete(request, id)
}
