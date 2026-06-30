import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: "Deprecated endpoint",
      message:
        "Use POST /api/github/scan for GitHub repository analysis, or create listings manually at /creator/upload/manual.",
      alternatives: {
        githubScan: "/api/github/scan",
        manualUpload: "/creator/upload/manual",
      },
    },
    { status: 410 }
  )
}
