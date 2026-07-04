/**
 * POST /api/nexus/bridge/command
 * Receives commands from IDE via bridge server.
 * Executes commands and returns results.
 */
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, ...commandData } = body

    const supabase = await createClient()

    // Verify device token from Authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const deviceToken = authHeader.replace("Bearer ", "")

    // Verify device token
    const { data: device, error: deviceError } = await supabase
      .from("bridge_devices")
      .select("*")
      .eq("token", deviceToken)
      .single()

    if (deviceError || !device) {
      return NextResponse.json({ error: "Invalid device token" }, { status: 401 })
    }

    // Update last_seen
    await supabase
      .from("bridge_devices")
      .update({ last_seen: new Date().toISOString() })
      .eq("id", device.id)

    // Handle different command types
    switch (type) {
      case "execute_workflow":
        // Execute workflow and return results
        const { executeWorkflow } = await import("@/lib/nexus/executor")
        const { data: workflowData } = await supabase
          .from("nexus_workflows")
          .select("*")
          .eq("id", commandData.workflow_id)
          .single()
        if (!workflowData) {
          return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
        }
        const result = await executeWorkflow(
          workflowData.definition,
          { id: workflowData.id, name: workflowData.name },
          commandData.input_data,
          undefined,
          {},
          device.id // Pass deviceId for bridge push
        )
        return NextResponse.json({ success: true, result })

      case "create_workflow":
        // Create new workflow
        const { data: workflow } = await supabase
          .from("nexus_workflows")
          .insert({
            user_id: device.user_id,
            name: commandData.name,
            definition: { nodes: commandData.nodes, edges: commandData.edges },
          })
          .select()
          .single()
        return NextResponse.json({ success: true, workflow })

      case "execute_skill":
        // Execute skill in IDE context
        // TODO: Implement skill execution
        return NextResponse.json({ success: true, message: "Skill execution not yet implemented" })

      case "generate_prompt":
        // Generate prompt based on context
        // TODO: Implement prompt generation
        return NextResponse.json({ success: true, message: "Prompt generation not yet implemented" })

      default:
        return NextResponse.json({ error: "Unknown command type" }, { status: 400 })
    }
  } catch (e) {
    console.error("bridge/command POST", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
