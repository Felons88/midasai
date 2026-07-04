import { NextResponse } from "next/server"

// Bridge port assignments per IDE
const IDE_PORTS: Record<string, number> = {
  "VS Code":  40001,
  "Cursor":   40002,
  "Windsurf": 40003,
}

export async function POST(request: Request) {
  const { name } = await request.json().catch(() => ({}))
  if (!name) return NextResponse.json({ reachable: false, error: "name required" }, { status: 400 })

  const port = IDE_PORTS[name]
  if (!port) return NextResponse.json({ reachable: false, error: "Unknown IDE" })

  // Server-side can't probe localhost of the *client* machine.
  // Return the port so the client can probe it directly via browser fetch.
  return NextResponse.json({ port, probeUrl: `http://localhost:${port}/midas-bridge/ping` })
}
