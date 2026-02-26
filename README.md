# OpenLeak Proxy Skill for OpenClaw 🦞🔓

> **Free Claude Sonnet 4.5 — fully automatic, zero browser interaction.**
> One command configures [OpenClaw](https://github.com/openclaw/openclaw) to use the [OpenLeak](https://openleak.fun) free Claude proxy. No credit card. No copy-pasting. No browser.

---

## ⚡ One-Command AI Setup

> Copy the block below and paste it into **any AI** (OpenClaw, Cursor, Claude, ChatGPT, etc.)
> The AI will do the full installation automatically — no human steps needed.

```
Install the OpenLeak proxy skill for OpenClaw. Follow these steps exactly:

STEP 1 — Clone the skill into OpenClaw's skills directory:
  Windows (PowerShell):
    git clone https://github.com/abdelrahman147/openleak-openclaw-skill.git "$env:USERPROFILE\.openclaw\workspace\skills\openleak-proxy"
  Linux/macOS:
    git clone https://github.com/abdelrahman147/openleak-openclaw-skill.git ~/.openclaw/workspace/skills/openleak-proxy

STEP 2 — Run the setup script (it auto-generates the API key — no browser needed):
  Windows (PowerShell):
    node "$env:USERPROFILE\.openclaw\workspace\skills\openleak-proxy\scripts\setup-openleak.js"
  Linux/macOS:
    node ~/.openclaw/workspace/skills/openleak-proxy/scripts/setup-openleak.js

STEP 3 — Reset OpenClaw:
  openclaw reset

STEP 4 — Verify by asking me: "What model are you using?"
  I should answer with "OpenLeak (free Claude)" or "claude-sonnet-4-5 via OpenLeak".

Note: Key generation is limited to 1 auto-generated key per IP per day. If you hit the limit,
wait until midnight UTC or visit https://openleak.fun/like to get a browser key (7/day extra),
then run: OPENLEAK_API_KEY=sk-cl-xxx node setup-openleak.js
```

---

## How It Works

The setup script calls the OpenLeak key generation API automatically:

```bash
POST https://openleak.fun/api/generate-key
→ { "key": "sk-cl-PLACEHOLDER_FOR_YOUR_KEY", "remaining": 0 }
```

Then patches `~/.openclaw/openclaw.json` with the correct provider block and verifies it live.

**Rate limits:**
| Method | Keys/day |
|--------|----------|
| This script (`/api/generate-key`) | **1 per IP** |
| Browser button at openleak.fun/like | 7 per IP |
| **Total possible** | **8 per IP/day** |

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

### 2 — Run Setup (fully automatic)

**Windows (PowerShell):**
```powershell
node "$env:USERPROFILE\.openclaw\workspace\skills\openleak-proxy\scripts\setup-openleak.js"
```

**Linux / macOS:**
```bash
node ~/.openclaw/workspace/skills/openleak-proxy/scripts/setup-openleak.js
```

### 3 — Reset OpenClaw

```bash
openclaw reset
```

### 4 — Verify

```bash
# Ask your OpenClaw agent:
# "What model are you currently using?"
# Expected: "OpenLeak (free Claude)"

# Or test the key directly:
curl -s -X POST https://openleak.fun/api/generate-key
```

---

## Rotating Your Key

The script auto-rotates for you (1 new key per day via the API). To force a manual rotation:

**Windows:**
```powershell
node "$env:USERPROFILE\.openclaw\workspace\skills\openleak-proxy\scripts\refresh-key.js"
openclaw reset
```

**Linux / macOS:**
```bash
node ~/.openclaw/workspace/skills/openleak-proxy/scripts/refresh-key.js
openclaw reset
```

If you hit the daily API limit, get a browser key from [openleak.fun/like](https://openleak.fun/like):
```powershell
$env:OPENLEAK_API_KEY = "sk-cl-your-browser-key"
node "$env:USERPROFILE\.openclaw\workspace\skills\openleak-proxy\scripts\setup-openleak.js"
```

---

## What Gets Written to openclaw.json

```json
{
  "env": { "OPENLEAK_API_KEY": "sk-cl-..." },
  "agents": {
    "defaults": {
      "model": { "primary": "openleak/claude-sonnet-4-5" },
      "models": { "openleak/claude-sonnet-4-5": { "alias": "OpenLeak (free Claude)" } }
    }
  },
  "models": {
    "mode": "merge",
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

---

## API Endpoints

| Format    | URL                       | Auth Header               |
|-----------|---------------------------|---------------------------|
| Anthropic | `https://openleak.fun`    | `x-api-key: sk-cl-...`   |
| OpenAI    | `https://openleak.fun/v1` | `Authorization: Bearer sk-cl-...` |

---

## Files

```
openleak-proxy/
├── README.md
├── SKILL.md                    ← OpenClaw skill definition (agent instructions)
└── scripts/
    ├── setup-openleak.js       ← Auto-generate key + patch config + verify
    └── refresh-key.js          ← Force key rotation
```

---

## Links

- 🦞 [OpenClaw](https://github.com/openclaw/openclaw)
- 🔓 [OpenLeak](https://openleak.fun) — free Claude API
- 📖 [OpenClaw Custom Providers Docs](https://docs.openclaw.ai/gateway/configuration-reference#custom-providers-and-base-urls)

---

## License

MIT
