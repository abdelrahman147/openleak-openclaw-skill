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

## API Endpoints (confirmed from openleak.fun)

| Format     | Base URL                  | Auth Header  |
|------------|---------------------------|--------------|
| Anthropic  | `https://openleak.fun`    | `x-api-key`  |
| OpenAI     | `https://openleak.fun/v1` | `Authorization: Bearer <key>` |

OpenClaw is configured to use the **Anthropic format** (`anthropic-messages` provider API).

---

## Key Format

Keys look like: **`sk-cl-PLACEHOLDER_FOR_YOUR_KEY`**

> ⚠️ **You get 6 free API keys per day.** Each visit to openleak.fun/like
> generates a fresh key. Once you have one, keep it and only rotate when it
> stops working.

---

## Setup Flow

### Step 1 — Get a Free API Key (browser required)

OpenLeak uses Cloudflare protection, so keys are generated in the browser —
there is no unauthenticated API endpoint for this step.

**Tell the user:**

> Please open **https://openleak.fun/like** in your browser, click
> **"Generate API Key"**, and paste the key here.
> It looks like `sk-cl-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.
> You get 6 free keys per day, so only generate a new one when needed.

Once they paste the key, continue to Step 2.

---

### Step 2 — Apply the Config

Run the helper script with the user's key:

**Linux/macOS:**
```bash
OPENLEAK_API_KEY="sk-cl-your-key-here" \
  node ~/.openclaw/workspace/skills/openleak-proxy/scripts/setup-openleak.js
```

**Windows (PowerShell):**
```powershell
$env:OPENLEAK_API_KEY = "sk-cl-your-key-here"
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
    "OPENLEAK_API_KEY": "sk-cl-your-key-here"
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

### Step 3 — Reset OpenClaw

```bash
openclaw reset
```

After reset, all agent turns will route through OpenLeak's free Claude proxy.

---

### Step 4 (Optional) — Manual curl Verification

```bash
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

1. Ask the user to visit `https://openleak.fun/like` and click "Generate API Key" again.
   Remind them: **6 keys per day limit** — only rotate when actually needed.
2. Run the script with `--apply-only` to skip re-verification:

**Windows:**
```powershell
$env:OPENLEAK_API_KEY = "sk-cl-new-key-here"
node "$env:USERPROFILE\.openclaw\workspace\skills\openleak-proxy\scripts\setup-openleak.js" --apply-only
openclaw reset
```

**Linux/macOS:**
```bash
OPENLEAK_API_KEY="sk-cl-new-key-here" \
  node ~/.openclaw/workspace/skills/openleak-proxy/scripts/setup-openleak.js --apply-only
openclaw reset
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `401 Unauthorized` | Key expired — get a new one at openleak.fun/like |
| `Model not found` | Ensure `api: "anthropic-messages"` and model id is `claude-sonnet-4-5` |
| Config not taking effect | Run `openclaw reset` |
| "6 keys remaining" counter | You get 6 per day; don't generate unnecessarily |
| Proxy down | Site may be temporarily down; retry in a few minutes |

---

## Files in This Skill

```
skills/openleak-proxy/
├── README.md
├── SKILL.md                    ← you are here
└── scripts/
    ├── setup-openleak.js       ← Apply key + patch openclaw.json + verify
    └── refresh-key.js          ← Rotate the key (used manually or by cron)
```
