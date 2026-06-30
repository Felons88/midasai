export const INSTALL_PLATFORMS = [
  { value: "CURSOR", label: "Cursor" },
  { value: "CLAUDE_CODE", label: "Claude Code" },
  { value: "CLAUDE_DESKTOP", label: "Claude Desktop" },
  { value: "WINDSURF", label: "Windsurf" },
  { value: "VSCODE", label: "VS Code" },
  { value: "GITHUB_COPILOT", label: "GitHub Copilot" },
  { value: "CLI", label: "CLI" },
  { value: "NPM", label: "npm" },
  { value: "MANUAL", label: "Manual" },
  { value: "OTHER", label: "Other" },
] as const

export type InstallPlatform = (typeof INSTALL_PLATFORMS)[number]["value"]
