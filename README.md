# OpenLeak Proxy Skill for OpenClaw 🦞🔓

> **Free Claude Sonnet 4.5 — no credit card, no rate limits.**
> Route all your [OpenClaw](https://github.com/openclaw/openclaw) AI traffic through the [OpenLeak](https://openleak.fun/like) free Claude proxy in one command.

---

## What This Does

- 🆓 Connects OpenClaw to **[openleak.fun](https://openleak.fun/like)** — a free, unlimited Claude Sonnet 4.5 API proxy
- 🔧 Auto-patches `~/.openclaw/openclaw.json` with the correct provider block
- ✅ Verifies your key works with a live test request
- 🔄 Supports one-command key rotation when needed

---

## ⚡ One-Command AI Setup

> Copy the block below and paste it into **any AI chat** (OpenClaw, ChatGPT, Claude, Cursor, etc.)  
> The AI will walk you through the entire setup automatically.

```
Install the OpenLeak proxy skill for OpenClaw by following these exact steps:

1. Clone the skill repo into the OpenClaw skills directory:
   - Run: git clone https://github.com/abdelrahman147/openleak-openclaw-skill.git "%USERPROFILE%\.openclaw\workspace\skills\openleak-proxy"
   - (Linux/macOS: git clone https://github.com/abdelrahman147/openleak-openclaw-skill.git ~/.openclaw/workspace/skills/openleak-proxy)

2. Tell me to open https://openleak.fun/like — I need to get a free API key from there.
   The user must open that URL in their browser, click "Generate API Key", and paste the key (starts with ol-) here.

3. Once I have the key, run the setup script:
   - Windows: $env:OPENLEAK_API_KEY="<paste key here>"; node "$env:USERPROFILE\.openclaw\workspace\skills\openleak-proxy\scripts\setup-openleak.js"
   - Linux/macOS: OPENLEAK_API_KEY=<paste key here> node ~/.openclaw/workspace/skills/openleak-proxy/scripts/setup-openleak.js

4. Restart OpenClaw: openclaw restart

5. Confirm it worked by asking me: "What model are you using?" — I should reply with "OpenLeak (free Claude)".
```

---

## Manual Setup (Step by Step)

### Prerequisites
- [OpenClaw](https://docs.openclaw.ai/start/getting-started) installed and running
- Node.js (any LTS version)
- Git

### 1. Clone This Skill

**Windows (PowerShell):**
```powershell
git clone https://github.com/abdelrahman147/openleak-openclaw-skill.git `
  "$env:USERPROFILE\.openclaw\workspace\skills\openleak-proxy"
```

**Linux / macOS:**
```bash
git clone https://github.com/abdelrahman147/openleak-openclaw-skill.git \
  ~/.openclaw/workspace/skills/openleak-proxy
```

### 2. Get Your Free API Key

1. Open **https://openleak.fun/like** in your browser
2. Click **"Generate API Key"**
3. Copy the key — it looks like `ol-xxxxxxxxxxxxxxxx`

### 3. Run Setup

**Windows (PowerShell):**
```powershell
$env:OPENLEAK_API_KEY = "ol-your-key-here"
node "$env:USERPROFILE\.openclaw\workspace\skills\openleak-proxy\scripts\setup-openleak.js"
```

**Linux / macOS:**
```bash
OPENLEAK_API_KEY="ol-your-key-here" \
  node ~/.openclaw/workspace/skills/openleak-proxy/scripts/setup-openleak.js
```

### 4. Restart OpenClaw

```bash
openclaw restart
```

### 5. Verify

Ask your OpenClaw assistant:
> **"What model are you currently using?"**

It should answer: *"OpenLeak (free Claude)"* or similar.

---

## Rotating Your Key

If your key stops working, get a fresh one from [openleak.fun/like](https://openleak.fun/like) and run:

**Windows:**
```powershell
$env:OPENLEAK_API_KEY = "ol-new-key-here"
node "$env:USERPROFILE\.openclaw\workspace\skills\openleak-proxy\scripts\setup-openleak.js" --apply-only
openclaw restart
```

**Linux / macOS:**
```bash
OPENLEAK_API_KEY="ol-new-key-here" \
  node ~/.openclaw/workspace/skills/openleak-proxy/scripts/setup-openleak.js --apply-only
openclaw restart
```

Or just say to your OpenClaw assistant: **"Refresh my OpenLeak key"** — this skill will guide them through it.

---

## How It Works

The skill registers `openleak.fun` as a custom **Anthropic-compatible** provider in OpenClaw:

```json
{
  "models": {
    "providers": {
      "openleak": {
        "baseUrl": "https://openleak.fun",
        "api": "anthropic-messages",
        "models": [{ "id": "claude-sonnet-4-5" }]
      }
    }
  }
}
```

OpenClaw natively supports custom providers with `api: "anthropic-messages"`, so no patching of OpenClaw itself is needed — it's pure config.

---

## Files

```
openleak-proxy/
├── README.md
├── SKILL.md                    ← OpenClaw skill definition (agent instructions)
└── scripts/
    ├── setup-openleak.js       ← Apply key + patch openclaw.json + verify
    └── refresh-key.js          ← Rotate the key (used by cron or manually)
```

---

## Links

- 🦞 [OpenClaw](https://github.com/openclaw/openclaw) — the AI assistant this skill is for
- 🔓 [OpenLeak](https://openleak.fun/like) — the free Claude API proxy
- 📖 [OpenClaw Custom Providers Docs](https://docs.openclaw.ai/gateway/configuration-reference#custom-providers-and-base-urls)

---

## License

MIT — use freely, no warranty.
