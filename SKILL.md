---
name: openleak-proxy
description: >
  Integrates OpenClaw with the free OpenLeak Claude API proxy (openleak.fun).
  Accepts your browser-generated API key, stores it in the OpenClaw
  configuration, and routes all Claude model traffic through the OpenLeak proxy
  — giving you unlimited, free Claude Sonnet access with zero credit card
  required.

  Trigger phrases (any of these will activate this skill):
    - "setup openleak"
    - "connect openleak"
    - "use openleak proxy"
    - "configure openleak"
    - "refresh openleak key"
    - "rotate openleak key"
    - "use free claude proxy"
---

# OpenLeak Proxy Skill 🦞

This skill lets OpenClaw use **[openleak.fun](https://openleak.fun/like)** as a
free, drop-in Claude API proxy. OpenLeak provides free Claude Sonnet 4.5 access
that is fully compatible with both the **OpenAI** and **Anthropic** SDKs.

---

## API Endpoints (confirmed from openleak.fun source)

| Format     | Base URL                    | Auth Header  |
|------------|-----------------------------|--------------|
| Anthropic  | `https://openleak.fun`      | `x-api-key`  |
| OpenAI     | `https://openleak.fun/v1`   | `Authorization: Bearer <key>` |

OpenClaw is configured to use the **Anthropic format** (`anthropic-messages`
provider API), which is a direct drop-in for `claude-sonnet-4-5`.

---

## Setup Flow

### Step 1 — Get a Free API Key (browser required)

OpenLeak uses Cloudflare protection, so keys are generated in the browser —
there is no API endpoint for this step.

**Tell the user:**

> Please open **https://openleak.fun/like** in your browser, click
> **"Generate API Key"**, and copy the key that appears (it starts with `ol-`).
> Paste it here and I'll configure everything automatically.

Once they paste the key, continue to Step 2.

---

### Step 2 — Apply the Config

Run the helper script with the user's key:

**Linux/macOS:**
```bash
OPENLEAK_API_KEY="<their-key>" \
  node "~/.openclaw/workspace/skills/openleak-proxy/scripts/setup-openleak.js"
```

**Windows (PowerShell):**
```powershell
$env:OPENLEAK_API_KEY = "<their-key>"
node "$env:USERPROFILE\.openclaw\workspace\skills\openleak-proxy\scripts\setup-openleak.js"
```

The script will:
1. Deep-merge the OpenLeak provider block into `~/.openclaw/openclaw.json`
2. Set `openleak/claude-sonnet-4-5` as the primary model
3. Run a live verification request to confirm the key works

**What gets written to openclaw.json:**
```json
{
  "env": {
    "OPENLEAK_API_KEY": "ol-xxx"
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "openleak/claude-sonnet-4-5",
        "fallbacks": []
      },
      "models": {
        "openleak/claude-sonnet-4-5": {
          "alias": "OpenLeak (free Claude)"
        }
      }
    }
  },
  "models": {
    "mode": "merge",
    "providers": {
      "openleak": {
        "baseUrl": "https://openleak.fun",
        "apiKey": "${OPENLEAK_API_KEY}",
        "api": "anthropic-messages",
        "models": [
          {
            "id": "claude-sonnet-4-5",
            "name": "Claude Sonnet 4.5 (via OpenLeak)",
            "reasoning": false,
            "input": ["text"],
            "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 },
            "contextWindow": 200000,
            "maxTokens": 8192
          }
        ]
      }
    }
  }
}
```

---

### Step 3 — Restart OpenClaw

```bash
openclaw restart
```

After restart, all agent turns will route through OpenLeak's free Claude proxy.

---

### Step 4 (Optional) — Manual curl Verification

```bash
# Anthropic format test:
curl -s https://openleak.fun/v1/messages \
  -H "x-api-key: $OPENLEAK_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-sonnet-4-5","max_tokens":16,"messages":[{"role":"user","content":"ping"}]}'
```

A successful response contains `"type": "message"`.

---

## Refreshing / Rotating the Key

When the user says **"refresh my OpenLeak key"** or **"rotate key"**:

1. Ask the user to get a new key from `https://openleak.fun/like` (click
   "Generate API Key" again — each visit gives a fresh key).
2. Run the script again with the new key:
   ```bash
   OPENLEAK_API_KEY="ol-new-key" node setup-openleak.js --apply-only
   ```
3. Restart OpenClaw: `openclaw restart`

---

## Optional: Daily Key Auto-Rotation via Cron

If the user wants automatic key rotation, set up a cron job.

Add this to `~/.openclaw/openclaw.json`:
```json
{
  "cron": {
    "enabled": true
  }
}
```

Create `~/.openclaw/workspace/cron/rotate-openleak-key.json5`:
```json5
{
  id: "rotate-openleak-key",
  schedule: "0 3 * * *",   // 3 AM daily
  // The agent will ask the user to paste a new key at 3 AM
  prompt: "Please run the openleak-proxy refresh flow: ask me for a new OpenLeak key and apply it.",
  agentId: "main",
  enabled: true
}
```

> **Note:** Since OpenLeak keys require browser generation, the cron job will
> prompt the user (via their active channel) to paste a fresh key.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `401 Unauthorized` | Key expired or rate-limited — get a new key at openleak.fun |
| `Model not found` | Ensure `api: "anthropic-messages"` and the model id is `claude-sonnet-4-5` |
| Config not taking effect | Run `openclaw restart` or `openclaw reload` |
| Script can't find openclaw.json | The path is `~/.openclaw/openclaw.json` — created automatically if missing |
| Proxy down | Site may be temporarily down; retry in a few minutes |

---

## Files in This Skill

```
skills/openleak-proxy/
├── SKILL.md                  ← you are here
└── scripts/
    ├── setup-openleak.js     ← apply key + patch openclaw.json + verify
    └── refresh-key.js        ← thin wrapper for key rotation
```
