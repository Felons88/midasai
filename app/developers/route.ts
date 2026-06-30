import { NextResponse } from "next/server"

export function GET() {
  return NextResponse.redirect(new URL("/developer", process.env.NEXT_PUBLIC_APP_URL || "https://midasai.tech"))
}
