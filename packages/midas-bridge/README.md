# midas-bridge

Connect your local IDE to [MidasAI](https://midasai.com) Nexus canvas.

## Usage

```bash
npx midas-bridge
```

That's it. The CLI will:

1. **Detect your IDE** — Windsurf, Cursor, or VS Code
2. **Open your browser** to the MidasAI authorization page
3. **Wait for you to approve** — the page shows your device name, IDE, and OS
4. **Save your device token** locally at `~/.midas-bridge/token.json`
5. **Start the bridge server** on `localhost` (port 40001–40003)

## How it works

```
Your IDE  →  npx midas-bridge  →  Opens browser auth page
                                         ↓
                              You click "Authorize Windsurf"
                                         ↓
                              Device saved to your account
                                         ↓
              Bridge server starts on localhost:40003
                                         ↓
              MidasAI Nexus probes localhost and connects
```

## Ports

| IDE       | Port  |
|-----------|-------|
| VS Code   | 40001 |
| Cursor    | 40002 |
| Windsurf  | 40003 |

## Revoking access

Go to **MidasAI → Nexus → Bridge** and click the trash icon next to your device.

To reset the stored token locally:

```bash
rm ~/.midas-bridge/token.json
```

## Environment

- `MIDAS_API_URL` — override the API base URL (default: `https://midasai.com`)

## Requirements

- Node.js ≥ 18
- No other dependencies — pure Node.js stdlib only
