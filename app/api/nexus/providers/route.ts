import { NextResponse } from "next/server"
import { providerRegistry } from "@/lib/credentials/provider-registry"

export async function GET() {
  const providers = providerRegistry.getAllConfigs()
  return NextResponse.json({ providers })
}
