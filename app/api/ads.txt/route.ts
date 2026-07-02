import { getAdSenseClientId } from "@/lib/ads/config"
import { readFileSync } from "node:fs"
import { join } from "node:path"

export function GET() {
  const clientId = getAdSenseClientId()
  if (!clientId) {
    try {
      const fallback = readFileSync(join(process.cwd(), "ads.txt"), "utf8")
      return new Response(fallback.endsWith("\n") ? fallback : `${fallback}\n`, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=86400",
        },
      })
    } catch {
      return new Response("Not configured", { status: 404 })
    }
  }

  const publisherId = clientId.startsWith("ca-") ? clientId.slice(3) : clientId

  return new Response(
    `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`,
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      },
    }
  )
}
