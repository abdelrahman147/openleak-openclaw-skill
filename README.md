# OpenLeak Proxy Skill for OpenClaw 🦞🔓

> **Free Claude Sonnet 4.5 — no credit card, no rate limits.**
> Route all your [OpenClaw](https://github.com/openclaw/openclaw) AI traffic through the [OpenLeak](https://openleak.fun/like) free Claude proxy in minutes.

---

## ⚡ One-Command AI Setup

> Copy the entire block below and paste it into **any AI** (OpenClaw, Cursor, Claude, ChatGPT, etc.)
> The AI will handle the full installation automatically.

```
Install the OpenLeak proxy skill for OpenClaw. Follow these steps exactly:

STEP 1 — Clone the skill into OpenClaw's skills directory:
  Windows: git clone https://github.com/abdelrahman147/openleak-openclaw-skill.git "$env:USERPROFILE\.openclaw\workspace\skills\openleak-proxy"
  Linux/macOS: git clone https://github.com/abdelrahman147/openleak-openclaw-skill.git ~/.openclaw/workspace/skills/openleak-proxy

STEP 2 — Ask me (the user) to open https://openleak.fun/like in my browser,
  click "Generate API Key", and paste the key here.
  The key looks like: sk-cl-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  Note: I get 6 free keys per day, so I only generate one when needed.

STEP 3 — Once I paste my key, run the setup script:
  Windows: $env:OPENLEAK_API_KEY="sk-cl-MYKEY"; node "$env:USERPROFILE\.openclaw\workspace\skills\openleak-proxy\scripts\setup-openleak.js"
  Linux/macOS: OPENLEAK_API_KEY=sk-cl-MYKEY node ~/.openclaw/workspace/skills/openleak-proxy/scripts/setup-openleak.js

STEP 4 — Restart OpenClaw:
  openclaw restart

STEP 5 — Verify it worked by asking me: "What model are you using?"
  I should answer with something like "OpenLeak (free Claude)" or "claude-sonnet-4-5 via OpenLeak".
```

---

## About OpenLeak Keys

Keys look like: `sk-cl-9jkxGpOlYkTxpwBaXiTCJxbnt8TVLdJzQe4nWNiU`

> ⚠️ **You get 6 free API keys per day.** Visit [openleak.fun/like](https://openleak.fun/like), click "Generate API Key", and copy it.
> Only generate a new key when your current one stops working — don't waste your daily quota.

---

## Manual Setup

### Prerequisites
- [OpenClaw](https://docs.openclaw.ai/start/getting-started) installed and running
- Node.js (any LTS)
- Git

### 1 — Clone This Skill

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

### 2 — Get Your Free API Key

1. Open **https://openleak.fun/like** in your browser
2. Click **"Generate API Key"**
3. Copy the key — it looks like `sk-cl-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 3 — Run Setup

**Windows (PowerShell):**
```powershell
$env:OPENLEAK_API_KEY = "sk-cl-your-key-here"
node "$env:USERPROFILE\.openclaw\workspace\skills\openleak-proxy\scripts\setup-openleak.js"
```

**Linux / macOS:**
```bash
OPENLEAK_API_KEY="sk-cl-your-key-here" \
  node ~/.openclaw/workspace/skills/openleak-proxy/scripts/setup-openleak.js
```

### 4 — Restart OpenClaw

```bash
openclaw restart
```

### 5 — Verify

Ask your OpenClaw assistant:
> **"What model are you currently using?"**

It should reply: *"OpenLeak (free Claude)"*

---

## Rotating / Refreshing Your Key

If your key hits the limit or stops working, get a fresh one from [openleak.fun/like](https://openleak.fun/like) and run:

**Windows:**
```powershell
$env:OPENLEAK_API_KEY = "sk-cl-new-key-here"
node "$env:USERPROFILE\.openclaw\workspace\skills\openleak-proxy\scripts\setup-openleak.js" --apply-only
openclaw restart
```

**Linux / macOS:**
```bash
OPENLEAK_API_KEY="sk-cl-new-key-here" \
  node ~/.openclaw/workspace/skills/openleak-proxy/scripts/setup-openleak.js --apply-only
openclaw restart
```

Or just tell your OpenClaw assistant: **"Refresh my OpenLeak key"**

---

## How It Works

OpenLeak provides a drop-in replacement for the Anthropic API. This skill registers it as a custom provider in `~/.openclaw/openclaw.json`:

```json
{
  "env": { "OPENLEAK_API_KEY": "sk-cl-your-key" },
  "models": {
    "providers": {
      "openleak": {
        "baseUrl": "https://openleak.fun",
        "apiKey": "${OPENLEAK_API_KEY}",
        "api": "anthropic-messages",
        "models": [{ "id": "claude-sonnet-4-5", "name": "Claude Sonnet 4.5 (via OpenLeak)" }]
      }
    }
  }
}
```

OpenClaw natively supports `api: "anthropic-messages"` custom providers — no patching of OpenClaw itself is needed.

---

## API Endpoints

| Format     | URL                       |
|------------|---------------------------|
| Anthropic  | `https://openleak.fun`    |
| OpenAI     | `https://openleak.fun/v1` |

---

## Files

```
openleak-proxy/
├── README.md
├── SKILL.md                    ← OpenClaw skill definition (agent instructions)
└── scripts/
    ├── setup-openleak.js       ← Apply key + patch openclaw.json + verify
    └── refresh-key.js          ← Rotate the key
```

---

## Links

- 🦞 [OpenClaw](https://github.com/openclaw/openclaw)
- 🔓 [OpenLeak](https://openleak.fun/like) — free Claude API
- 📖 [OpenClaw Custom Providers Docs](https://docs.openclaw.ai/gateway/configuration-reference#custom-providers-and-base-urls)

---

## License

MIT
