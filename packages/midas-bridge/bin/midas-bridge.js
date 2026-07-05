#!/usr/bin/env node
/**
 * midas-bridge — Connect your local IDE to MidasAI Nexus
 *
 * Usage: npx @midasai/bridge [--port <port>] [--host <host>]
 *
 * What this does:
 *  1. Detects which IDE is running (Windsurf, Cursor, VS Code)
 *  2. Determines device info (hostname, OS, arch)
 *  3. POSTs an auth request to MidasAI → gets back an auth URL
 *  4. Opens the URL in the default browser
 *  5. Polls every 2s until the user approves or denies
 *  6. On approval, stores the device token and starts the local HTTP server
 *  7. Bridge server responds to GET /midas-bridge/ping with { version, ide, status }
 */

const http = require("http")
const https = require("https")
const os = require("os")
const { execSync, exec } = require("child_process")
const { existsSync, mkdirSync, readFileSync, writeFileSync } = require("fs")
const { join } = require("path")
const { createServer } = require("http")

// ─── Config ────────────────────────────────────────────────────────────────
const VERSION = "1.0.5"
const MIDAS_API = process.env.MIDAS_API_URL || "https://midasai.tech"
const CONFIG_DIR = join(os.homedir(), ".midas-bridge")
const TOKEN_FILE = join(CONFIG_DIR, "token.json")
const AUTH_FILE = join(CONFIG_DIR, "auth.json")
const POLL_INTERVAL_MS = 2000
const AUTH_TIMEOUT_MS = 10 * 60 * 1000 // 10 min

// IDE port assignments — must match MidasBridge.tsx IDE_PORTS
const IDE_PORTS = {
  "Windsurf":    40003,
  "Cursor":      40002,
  "VS Code":     40001,
  "Claude Code": 40004,
}

// IDE extension installation commands
const IDE_EXTENSIONS = {
  "VS Code": {
    check: "code --list-extensions | findstr midasai.midas-bridge",
    install: "code --install-extension midasai.midas-bridge",
    hasExtension: true,
  },
  "Cursor": {
    check: "cursor --list-extensions | findstr midasai.midas-bridge",
    install: "cursor --install-extension midasai.midas-bridge",
    hasExtension: true,
  },
  "Windsurf": {
    check: "windsurf --list-extensions | findstr midasai.midas-bridge",
    install: "windsurf --install-extension midasai.midas-bridge",
    hasExtension: true,
  },
  "Claude Code": {
    hasExtension: false, // Uses MCP, no extension needed
  },
}

// ─── Detect IDE ─────────────────────────────────────────────────────────────
function detectIDE() {
  // Allow manual override via --ide flag
  const ideFlag = process.argv.find((_, i) => process.argv[i - 1] === "--ide")
  if (ideFlag && IDE_PORTS[ideFlag]) {
    return { name: ideFlag, version: null }
  }

  // Check env variables set by each IDE
  if (process.env.CLAUDE_CODE_SESSION || process.env.CLAUDE_API_KEY_HELPER_TTY || process.env.CLAUDE_CODE_ENTRYPOINT) {
    return { name: "Claude Code", version: process.env.CLAUDE_CODE_VERSION || null }
  }
  if (process.env.WINDSURF_APP_NAME || process.env.WINDSURF_REMOTE_CONTAINERS_IPC) {
    return { name: "Windsurf", version: process.env.WINDSURF_APP_VERSION || null }
  }
  if (process.env.CURSOR_CHANNEL || process.env.CURSOR_TRACE_ID) {
    return { name: "Cursor", version: process.env.CURSOR_APP_VERSION || null }
  }
  if (process.env.VSCODE_PID || process.env.VSCODE_IPC_HOOK || process.env.TERM_PROGRAM === "vscode") {
    return { name: "VS Code", version: process.env.VSCODE_APP_VERSION || null }
  }

  // Check running processes as fallback - detect ALL running IDEs
  const runningIDEs = []
  try {
    const ps = os.platform() === "win32"
      ? execSync("tasklist /FO CSV /NH 2>NUL", { timeout: 3000 }).toString()
      : execSync("ps aux 2>/dev/null", { timeout: 3000 }).toString()
    const lower = ps.toLowerCase()
    if (lower.includes("claude"))   runningIDEs.push({ name: "Claude Code", version: null })
    if (lower.includes("windsurf")) runningIDEs.push({ name: "Windsurf",    version: null })
    if (lower.includes("cursor"))   runningIDEs.push({ name: "Cursor",      version: null })
    if (lower.includes("code"))     runningIDEs.push({ name: "VS Code",     version: null })
  } catch (_) {}

  // If multiple IDEs detected, return all for selection
  if (runningIDEs.length > 0) {
    return { runningIDEs, multiple: true }
  }

  return { name: "VS Code", version: null, multiple: false } // default fallback
}

// ─── Device info ─────────────────────────────────────────────────────────────
function getDeviceInfo() {
  const platform = os.platform()
  let osName = platform
  try {
    if (platform === "win32") {
      const ver = execSync("ver", { timeout: 2000 }).toString().trim()
      osName = ver.includes("11") ? "Windows 11" : "Windows 10"
    } else if (platform === "darwin") {
      const ver = execSync("sw_vers -productVersion", { timeout: 2000 }).toString().trim()
      osName = `macOS ${ver}`
    } else {
      const ver = execSync("uname -r", { timeout: 2000 }).toString().trim()
      osName = `Linux ${ver}`
    }
  } catch (_) {}

  return {
    device_name: os.hostname(),
    device_os:   osName,
    device_arch: os.arch(),
  }
}

// ─── Token storage ───────────────────────────────────────────────────────────
function loadToken(ideName) {
  try {
    if (!existsSync(TOKEN_FILE)) return null
    const data = JSON.parse(readFileSync(TOKEN_FILE, "utf-8"))
    return data[ideName] || null
  } catch (_) { return null }
}

function saveToken(ideName, token) {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true })
  let data = {}
  try { data = JSON.parse(readFileSync(TOKEN_FILE, "utf-8")) } catch (_) {}
  data[ideName] = token
  writeFileSync(TOKEN_FILE, JSON.stringify(data, null, 2), "utf-8")
}

// ─── Auth token storage (user login) ───────────────────────────────────────────
function loadAuth() {
  try {
    if (!existsSync(AUTH_FILE)) return null
    return JSON.parse(readFileSync(AUTH_FILE, "utf-8"))
  } catch (_) { return null }
}

function saveAuth(authToken, userId, email) {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true })
  writeFileSync(AUTH_FILE, JSON.stringify({ token: authToken, userId, email }, null, 2), "utf-8")
}

// ─── Extension installation ─────────────────────────────────────────────────────
function checkAndInstallExtension(ideName) {
  const extConfig = IDE_EXTENSIONS[ideName]
  if (!extConfig || !extConfig.hasExtension) {
    return // No extension needed for this IDE
  }

  console.log(`  Checking for Midas extension in ${ideName}...`)

  try {
    const checkCmd = os.platform() === "win32" ? extConfig.check.replace("findstr", "findstr") : extConfig.check.replace("findstr", "grep")
    const result = execSync(checkCmd, { timeout: 5000, stdio: "pipe" }).toString()
    
    if (result.includes("midasai.midas-bridge")) {
      console.log(`  ✓ Midas extension already installed\n`)
      return
    }
  } catch (_) {
    // Extension not found, proceed to install
  }

  console.log(`  Installing Midas extension for ${ideName}...`)
  try {
    execSync(extConfig.install, { timeout: 60000, stdio: "inherit" })
    console.log(`  ✓ Extension installed successfully\n`)
  } catch (err) {
    console.log(`  ⚠ Could not auto-install extension. Please run manually:\n`)
    console.log(`    ${extConfig.install}\n`)
  }
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
function apiPost(path, body, authToken = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, MIDAS_API)
    const payload = JSON.stringify(body)
    const lib = url.protocol === "https:" ? https : http
    const headers = {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
      "User-Agent": `midas-bridge/${VERSION}`,
    }
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`
    }
    const req = lib.request({
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname,
      method: "POST",
      headers,
    }, (res) => {
      let data = ""
      res.on("data", c => { data += c })
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch (_) { resolve({ status: res.statusCode, body: data }) }
      })
    })
    req.on("error", reject)
    req.write(payload)
    req.end()
  })
}

function apiGet(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, MIDAS_API)
    const lib = url.protocol === "https:" ? https : http
    const req = lib.request({
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname + url.search,
      method: "GET",
      headers: { "User-Agent": `midas-bridge/${VERSION}` },
    }, (res) => {
      let data = ""
      res.on("data", c => { data += c })
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch (_) { resolve({ status: res.statusCode, body: data }) }
      })
    })
    req.on("error", reject)
    req.end()
  })
}

// ─── Open browser ─────────────────────────────────────────────────────────────
function openBrowser(url) {
  const cmd = os.platform() === "win32" ? `start "" "${url}"`
    : os.platform() === "darwin" ? `open "${url}"`
    : `xdg-open "${url}"`
  exec(cmd, (err) => {
    if (err) {
      console.log(`\n  Couldn't open browser automatically.`)
      console.log(`  Please open this URL manually:\n`)
      console.log(`  ${url}\n`)
    }
  })
}

// ─── Bridge HTTP server ───────────────────────────────────────────────────────
function startBridgeServer(port, ideName, deviceToken) {
  // Event clients for SSE
  const eventClients = new Set()

  const server = createServer((req, res) => {
    // CORS headers so browser can fetch from localhost
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")

    if (req.method === "OPTIONS") {
      res.writeHead(204)
      res.end()
      return
    }

    if (req.url === "/midas-bridge/ping") {
      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(JSON.stringify({
        version: VERSION,
        ide: ideName,
        status: "connected",
        device: os.hostname(),
      }))
      return
    }

    // Auth verification endpoint (MidasAI web app sends device token to verify)
    if (req.url === "/midas-bridge/verify") {
      const authHeader = req.headers["authorization"] || ""
      const token = authHeader.replace("Bearer ", "").trim()
      if (token === deviceToken) {
        res.writeHead(200, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ authorized: true, ide: ideName }))
      } else {
        res.writeHead(401, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ authorized: false }))
      }
      return
    }

    // Command endpoint - IDE sends commands to MidasAI
    if (req.url === "/midas-bridge/command" && req.method === "POST") {
      let body = ""
      req.on("data", chunk => { body += chunk })
      req.on("end", async () => {
        try {
          const command = JSON.parse(body)
          // Forward command to MidasAI API
          const result = await apiPost("/api/nexus/bridge/command", command, deviceToken)
          res.writeHead(200, { "Content-Type": "application/json" })
          res.end(JSON.stringify(result.body))
        } catch (err) {
          res.writeHead(500, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ error: err.message }))
        }
      })
      return
    }

    // Sync endpoint - IDE pushes workspace context
    if (req.url === "/midas-bridge/sync" && req.method === "POST") {
      let body = ""
      req.on("data", chunk => { body += chunk })
      req.on("end", async () => {
        try {
          const syncData = JSON.parse(body)
          // Forward to MidasAI API
          const result = await apiPost("/api/nexus/bridge/sync", syncData, deviceToken)
          res.writeHead(200, { "Content-Type": "application/json" })
          res.end(JSON.stringify(result.body))
        } catch (err) {
          res.writeHead(500, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ error: err.message }))
        }
      })
      return
    }

    // SSE events endpoint - IDE subscribes to real-time updates
    if (req.url === "/midas-bridge/events") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      })

      eventClients.add(res)

      req.on("close", () => {
        eventClients.delete(res)
      })

      // Send initial connection event
      res.write(`data: ${JSON.stringify({ type: "connected", ide: ideName })}\n\n`)
      return
    }

    // Push endpoint - MidasAI pushes events to IDEs
    if (req.url === "/midas-bridge/push" && req.method === "POST") {
      let body = ""
      req.on("data", chunk => { body += chunk })
      req.on("end", () => {
        try {
          const { event } = JSON.parse(body)
          // Broadcast to all SSE clients
          eventClients.forEach(client => {
            try {
              client.write(`data: ${JSON.stringify(event)}\n\n`)
            } catch (err) {
              // Client disconnected, remove from set
              eventClients.delete(client)
            }
          })
          res.writeHead(200, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ success: true, clients: eventClients.size }))
        } catch (err) {
          res.writeHead(400, { "Content-Type": "application/json" })
          res.end(JSON.stringify({ error: err.message }))
        }
      })
      return
    }

    res.writeHead(404)
    res.end()
  })

  server.listen(port, "127.0.0.1", () => {
    console.log(`\n  ✓ Midas Bridge running on http://localhost:${port}`)
    console.log(`  ✓ MidasAI Nexus is now connected to ${ideName}`)
    console.log(`\n  Keep this terminal open. Press Ctrl+C to disconnect.\n`)
  })

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\n  ✗ Port ${port} is already in use.`)
      console.error(`  Another Midas Bridge instance may already be running.\n`)
    } else {
      console.error(`\n  ✗ Bridge server error: ${err.message}\n`)
    }
    process.exit(1)
  })

  process.on("SIGINT", () => {
    console.log("\n\n  Disconnecting Midas Bridge...")
    server.close(() => process.exit(0))
  })
}

// ─── Login handler ─────────────────────────────────────────────────────────────
async function handleLogin() {
  console.log(`\n  ╔═══════════════════════════════════╗`)
  console.log(`  ║     Midas Bridge  v${VERSION}         ║`)
  console.log(`  ║  Login to MidasAI               ║`)
  console.log(`  ╚═══════════════════════════════════╝\n`)

  // Check if already logged in and show message
  const existingAuth = loadAuth()
  if (existingAuth) {
    console.log(`  Currently logged in as ${existingAuth.email}`)
    console.log(`  Initiating new login to change account...\n`)
  }

  // Create login request
  console.log(`  Creating login request...\n`)
  let authResult
  try {
    authResult = await apiPost("/api/cli/login", {})
  } catch (err) {
    console.error(`  ✗ Could not connect to MidasAI: ${err.message}`)
    console.error(`  Make sure you have internet access and try again.\n`)
    process.exit(1)
  }

  if (authResult.status !== 200 || !authResult.body.token) {
    console.error(`  ✗ Failed to create login request: ${JSON.stringify(authResult.body)}\n`)
    process.exit(1)
  }

  const { token, authUrl } = authResult.body

  console.log(`  ┌──────────────────────────────────────────────┐`)
  console.log(`  │  Opening your browser to login...            │`)
  console.log(`  │                                              │`)
  console.log(`  │  ${authUrl.slice(0, 44).padEnd(44)}  │`)
  console.log(`  │                                              │`)
  console.log(`  │  Sign in to authorize this CLI.              │`)
  console.log(`  │  This link expires in 10 minutes.            │`)
  console.log(`  └──────────────────────────────────────────────┘\n`)

  openBrowser(authUrl)

  // Poll for approval
  console.log(`  Waiting for authorization`)
  const deadline = Date.now() + AUTH_TIMEOUT_MS
  let authData = null

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))
    process.stdout.write(".")

    let pollResult
    try {
      pollResult = await apiGet(`/api/cli/auth/${token}/poll`)
    } catch (_) { continue }

    const status = pollResult.body?.status
    if (status === "approved") {
      authData = pollResult.body
      console.log(`\n\n  ✓ Logged in as ${authData.email}\n`)
      break
    }
    if (status === "denied") {
      console.log(`\n\n  ✗ Login denied.\n`)
      process.exit(1)
    }
    if (status === "expired") {
      console.log(`\n\n  ✗ Login timed out. Run 'npx @midasai/bridge login' to retry.\n`)
      process.exit(1)
    }
  }

  if (!authData) {
    console.log(`\n\n  ✗ Login timed out.\n`)
    process.exit(1)
  }

  // Save auth token
  saveAuth(authData.token, authData.userId, authData.email)
  console.log(`  ✓ Auth token saved to ${AUTH_FILE}`)
  console.log(`  Run 'npx @midasai/bridge' to connect your IDE.\n`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const command = process.argv[2]

  // Handle 'login' command
  if (command === "login") {
    await handleLogin()
    return
  }

  console.log(`\n  ╔═══════════════════════════════════╗`)
  console.log(`  ║     Midas Bridge  v${VERSION}         ║`)
  console.log(`  ║  Connect your IDE to MidasAI      ║`)
  console.log(`  ╚═══════════════════════════════════╝\n`)

  const ideResult = detectIDE()
  let ide
  let device
  let port

  // Handle multiple IDEs detection
  if (ideResult.multiple && ideResult.runningIDEs.length > 1) {
    console.log(`  Multiple IDEs detected:\n`)
    ideResult.runningIDEs.forEach((ide, i) => {
      console.log(`  [${i + 1}] ${ide.name}`)
    })
    console.log(`\n  Select IDE to connect (1-${ideResult.runningIDEs.length}): `)
    
    // Simple readline for selection
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    
    const selection = await new Promise(resolve => {
      rl.question('', (answer) => {
        rl.close()
        resolve(parseInt(answer) - 1)
      })
    })
    
    if (isNaN(selection) || selection < 0 || selection >= ideResult.runningIDEs.length) {
      console.log(`\n  ✗ Invalid selection. Using first IDE.\n`)
      ide = ideResult.runningIDEs[0]
    } else {
      ide = ideResult.runningIDEs[selection]
    }
  } else {
    ide = ideResult.multiple ? ideResult.runningIDEs[0] : ideResult
  }

  device = getDeviceInfo()
  port = IDE_PORTS[ide.name] || 40001

  console.log(`  Selected IDE:    ${ide.name}${ide.version ? ` ${ide.version}` : ""}`)
  console.log(`  Device:          ${device.device_name}`)
  console.log(`  OS:              ${device.device_os} (${device.device_arch})`)
  console.log(`  Bridge port:     ${port}`)

  // Check for user auth (from 'midas login')
  const auth = loadAuth()
  if (!auth) {
    console.log(`\n  ✗ Not logged in. Run 'npx @midasai/bridge login' first.\n`)
    process.exit(1)
  }

  console.log(`  ✓ Logged in as ${auth.email}\n`)

  // Check and install IDE extension if needed (disabled until extension is published)
  // checkAndInstallExtension(ide.name)

  // Check for existing stored device token
  const existingToken = loadToken(ide.name)
  if (existingToken) {
    console.log(`  Found stored device token. Starting bridge...\n`)
    startBridgeServer(port, ide.name, existingToken)
    return
  }

  // Create device directly using auth token
  console.log(`  Registering device with MidasAI...\n`)
  let deviceResult
  try {
    deviceResult = await apiPost("/api/nexus/bridge/device", {
      ide_name: ide.name,
      ide_version: ide.version,
      device_name: device.device_name,
      device_os: device.device_os,
      device_arch: device.device_arch,
      bridge_port: port,
      bridge_version: VERSION,
    }, auth.token)
  } catch (err) {
    console.error(`  ✗ Could not register device: ${err.message}`)
    console.error(`  Make sure you have internet access and try again.\n`)
    process.exit(1)
  }

  if (deviceResult.status !== 200 || !deviceResult.body.device_token) {
    console.error(`  ✗ Failed to register device: ${JSON.stringify(deviceResult.body)}\n`)
    process.exit(1)
  }

  const { device_token, mcp_endpoint } = deviceResult.body

  console.log(`  ✓ Device registered!\n`)
  if (mcp_endpoint) {
    console.log(`  ┌─ MCP Connection Created ───────────────────────────────┐`)
    console.log(`  │                                                        │`)
    console.log(`  │  Your IDE is now registered as an MCP agent.           │`)
    console.log(`  │  Add MidasAI to Claude Code:                           │`)
    console.log(`  │                                                        │`)
    console.log(`  │  claude mcp add --transport http midasai \\             │`)
    console.log(`  │    ${mcp_endpoint.padEnd(48)}  │`)
    console.log(`  │                                                        │`)
    console.log(`  │  Find your MCP token at:                               │`)
    console.log(`  │  ${MIDAS_API}/developer/mcp`.padEnd(58) + `  │`)
    console.log(`  └────────────────────────────────────────────────────────┘\n`)
  }

  // Save device token for future runs
  saveToken(ide.name, device_token)
  console.log(`  ✓ Device token saved to ${TOKEN_FILE}\n`)

  // Start bridge server
  startBridgeServer(port, ide.name, device_token)
}

main().catch(err => {
  console.error(`\n  ✗ Unexpected error: ${err.message}\n`)
  process.exit(1)
})
