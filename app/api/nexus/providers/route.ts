import { NextResponse } from "next/server"
import { providerRegistry } from "@/lib/credentials/provider-registry"
// Import providers to ensure they are registered
import "@/lib/credentials/providers"

export async function GET() {
  const providers = providerRegistry.getAllConfigs()
  return NextResponse.json({ providers })
}
