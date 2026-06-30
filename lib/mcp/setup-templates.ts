export type McpClientTool =
  | "cursor"
  | "copilot"
  | "claude-code"
  | "claude-desktop"
  | "windsurf"
  | "devin"

export type McpSetupContext = {
  connectionName: string
  token: string
  endpoint: string
  siteUrl: string
}

export type McpToolSetup = {
  id: McpClientTool
  label: string
  description: string
  configLabel: string
  configPath: string
  format: "json" | "prompt" | "shell"
}

export const MCP_CLIENT_TOOLS: McpToolSetup[] = [
  {
    id: "cursor",
    label: "Cursor",
    description: "Paste into Cursor Settings → MCP",
    configLabel: "mcp.json",
    configPath: "~/.cursor/mcp.json",
    format: "json",
  },
  {
    id: "copilot",
    label: "GitHub Copilot",
    description: "VS Code / Copilot MCP user settings",
    configLabel: "MCP config",
    configPath: "VS Code → Settings → MCP",
    format: "json",
  },
  {
    id: "claude-code",
    label: "Claude Code",
    description: "CLI or project MCP settings",
    configLabel: "Shell command",
    configPath: "Terminal or .claude/settings.json",
    format: "shell",
  },
  {
    id: "claude-desktop",
    label: "Claude Desktop",
    description: "Desktop app MCP configuration",
    configLabel: "claude_desktop_config.json",
    configPath: "%APPDATA%\\Claude\\claude_desktop_config.json",
    format: "json",
  },
  {
    id: "windsurf",
    label: "Windsurf",
    description: "Cascade MCP server settings",
    configLabel: "mcp_config.json",
    configPath: "~/.codeium/windsurf/mcp_config.json",
    format: "json",
  },
  {
    id: "devin",
    label: "Devin",
    description: "Paste setup instructions into Devin",
    configLabel: "Setup prompt",
    configPath: "Devin workspace instructions",
    format: "prompt",
  },
]

function httpMcpJson(ctx: McpSetupContext, serverKey = "midasai") {
  return JSON.stringify(
    {
      mcpServers: {
        [serverKey]: {
          url: ctx.endpoint,
          headers: {
            "X-MCP-Token": ctx.token,
          },
        },
      },
    },
    null,
    2
  )
}

export function getMcpToolConfig(tool: McpClientTool, ctx: McpSetupContext): string {
  switch (tool) {
    case "cursor":
    case "copilot":
    case "claude-desktop":
    case "windsurf":
      return httpMcpJson(ctx)
    case "claude-code":
      return [
        `# Add MidasAI MCP (${ctx.connectionName})`,
        `claude mcp add --transport http midasai ${ctx.endpoint} \\`,
        `  --header "X-MCP-Token: ${ctx.token}"`,
        "",
        `# Or merge into .claude/settings.json:`,
        httpMcpJson(ctx, "midasai"),
      ].join("\n")
    case "devin":
      return getMcpSetupPrompt("devin", ctx)
    default:
      return httpMcpJson(ctx)
  }
}

export function getMcpSetupPrompt(tool: McpClientTool, ctx: McpSetupContext): string {
  const base = [
    `Connect my MidasAI account via MCP for "${ctx.connectionName}".`,
    ``,
    `MCP endpoint: ${ctx.endpoint}`,
    `MCP token: ${ctx.token}`,
    `Auth header: X-MCP-Token: ${ctx.token}`,
    ``,
    `Use JSON-RPC 2.0 (initialize, tools/list, tools/call).`,
    `Do not expose this token in public repos or chat logs.`,
  ]

  switch (tool) {
    case "cursor":
      return [
        ...base,
        ``,
        `Add this to ~/.cursor/mcp.json:`,
        ``,
        httpMcpJson(ctx),
      ].join("\n")
    case "copilot":
      return [
        ...base,
        ``,
        `In VS Code, open Copilot MCP settings and add an HTTP MCP server:`,
        `- Name: midasai`,
        `- URL: ${ctx.endpoint}`,
        `- Header X-MCP-Token: ${ctx.token}`,
        ``,
        `JSON equivalent:`,
        ``,
        httpMcpJson(ctx),
      ].join("\n")
    case "claude-code":
      return [
        ...base,
        ``,
        `Run in terminal:`,
        `claude mcp add --transport http midasai ${ctx.endpoint} --header "X-MCP-Token: ${ctx.token}"`,
        ``,
        `Or add to .claude/settings.json:`,
        ``,
        httpMcpJson(ctx),
      ].join("\n")
    case "claude-desktop":
      return [
        ...base,
        ``,
        `Edit claude_desktop_config.json and merge:`,
        ``,
        httpMcpJson(ctx),
        ``,
        `Restart Claude Desktop after saving.`,
      ].join("\n")
    case "windsurf":
      return [
        ...base,
        ``,
        `Open Windsurf → MCP settings and paste:`,
        ``,
        httpMcpJson(ctx),
      ].join("\n")
    case "devin":
      return [
        `You are connected to MidasAI via MCP.`,
        ``,
        `Connection: ${ctx.connectionName}`,
        `Endpoint: ${ctx.endpoint}`,
        `Authentication: send header X-MCP-Token with value ${ctx.token}`,
        ``,
        `Capabilities: search marketplace listings, read account context, and use role-scoped MidasAI tools.`,
        `Always call ${ctx.endpoint} with the X-MCP-Token header on every MCP request.`,
        `Never commit or share this token.`,
      ].join("\n")
    default:
      return base.join("\n")
  }
}

export function getMcpDownloadBundle(ctx: McpSetupContext): string {
  const sections = MCP_CLIENT_TOOLS.map((tool) => {
    const config = getMcpToolConfig(tool.id, ctx)
    const prompt = getMcpSetupPrompt(tool.id, ctx)
    return [
      `=== ${tool.label} (${tool.configPath}) ===`,
      config,
      "",
      "--- Copy prompt ---",
      prompt,
    ].join("\n")
  })

  return [
    `MidasAI MCP Connection: ${ctx.connectionName}`,
    `Generated: ${new Date().toISOString()}`,
    `Endpoint: ${ctx.endpoint}`,
    `Token: ${ctx.token}`,
    "",
    ...sections,
    "",
    "IMPORTANT: Store this file securely. The token grants access to your MidasAI account.",
  ].join("\n")
}
