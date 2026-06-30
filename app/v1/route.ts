import { NextResponse } from "next/server"
import { getApiUrl, getDocsUrl } from "@/lib/site-url"

export async function GET() {
  const apiUrl = getApiUrl()
  return NextResponse.json({
    name: "MidasAI API",
    version: "1",
    status: "operational",
    docs: getDocsUrl(),
    baseUrl: `${apiUrl}/v1`,
    authentication: "Bearer API key (mk_* or midas_live_*)",
  })
}
