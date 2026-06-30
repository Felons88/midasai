import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  message: z.string().min(10).max(5000),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const { name, email, message } = parsed.data
    const service = createServiceClient()

    const { error } = await service.from("audit_logs").insert({
      action: "contact_form_submission",
      entity_type: "contact",
      metadata: { name, email, message },
    })

    if (error) {
      console.error("Contact insert error:", error)
      return NextResponse.json({ error: "Could not save message" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Contact API error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
