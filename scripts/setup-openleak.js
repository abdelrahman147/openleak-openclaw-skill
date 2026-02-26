#!/usr/bin/env node
/**
 * setup-openleak.js
 * ─────────────────────────────────────────────────────────────────────────────
 * OpenClaw Skill: openleak-proxy
 *
 * Configures OpenClaw to use the free OpenLeak Claude API proxy.
 *
 * HOW OPENLEAK KEYS WORK:
 *   Keys are generated entirely in the browser at https://openleak.fun/like
 *   (click "Generate API Key"). Cloudflare protects the site from bots, so
 *   there is no unauthenticated REST endpoint for programmatic creation.
 *
 *   API Endpoints (confirmed from openleak.fun page source):
 *     Anthropic format : https://openleak.fun/      (SDK appends /v1/messages)
 *     OpenAI format    : https://openleak.fun/v1    (SDK appends /chat/completions)
 *
 * Usage:
 *   # 1. Get your key from https://openleak.fun/like  (click "Generate API Key")
 *   # 2. Run this script with your key:
 *
 *   Windows (PowerShell):
 *     $env:OPENLEAK_API_KEY="sk-cl-xxx"; node setup-openleak.js
 *
 *   Linux/macOS:
 *     OPENLEAK_API_KEY=sk-cl-xxx node setup-openleak.js
 *
 *   # Skip the live verification step:
 *   OPENLEAK_API_KEY=sk-cl-xxx node setup-openleak.js --apply-only
 *
 *   Options:
 *     --apply-only   skip the live verification step (faster)
 *     --info         print config paths and exit
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use strict";

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

// ── Constants (confirmed from openleak.fun HTML source) ───────────────────────

const OPENLEAK_BASE = "https://openleak.fun";
// Anthropic SDK: base URL, messages path appended as /v1/messages
const OPENLEAK_ANTHROPIC_BASE = OPENLEAK_BASE;
// OpenAI SDK: base URL is /v1
const OPENLEAK_OPENAI_BASE = `${OPENLEAK_BASE}/v1`;

const OPENCLAW_CONFIG_PATH = path.join(os.homedir(), ".openclaw", "openclaw.json");

// ── HTTP helper ───────────────────────────────────────────────────────────────

function httpRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const lib = parsed.protocol === "https:" ? https : http;
        const body = options.body || null;

        const req = lib.request({
            hostname: parsed.hostname,
            port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
            path: parsed.pathname + (parsed.search || ""),
            method: options.method || "GET",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "openclaw-openleak-skill/1.0",
                "Accept": "application/json",
                ...(body ? { "Content-Length": Buffer.byteLength(body) } : {}),
                ...(options.headers || {}),
            },
        }, (res) => {
            let data = "";
            res.on("data", (c) => (data += c));
            res.on("end", () => resolve({ status: res.statusCode, body: data }));
        });

        req.on("error", reject);
        if (body) req.write(body);
        req.end();
    });
}

// ── Config helpers ────────────────────────────────────────────────────────────

function deepMerge(target, source) {
    const result = Object.assign({}, target);
    for (const key of Object.keys(source)) {
        const sv = source[key];
        const tv = result[key];
        if (sv && typeof sv === "object" && !Array.isArray(sv) &&
            tv && typeof tv === "object" && !Array.isArray(tv)) {
            result[key] = deepMerge(tv, sv);
        } else {
            result[key] = sv;
        }
    }
    return result;
}

function readConfig() {
    if (!fs.existsSync(OPENCLAW_CONFIG_PATH)) return {};
    try {
        const raw = fs.readFileSync(OPENCLAW_CONFIG_PATH, "utf8")
            .replace(/\/\/[^\n]*/g, "")   // strip // comments (JSON5-ish)
            .replace(/,\s*([\]}])/g, "$1"); // strip trailing commas
        return JSON.parse(raw);
    } catch (e) {
        console.warn("⚠️  Could not parse existing openclaw.json — will overlay on top of it.");
        console.warn("   Reason:", e.message);
        return {};
    }
}

function writeConfig(cfg) {
    const dir = path.dirname(OPENCLAW_CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(OPENCLAW_CONFIG_PATH, JSON.stringify(cfg, null, 2) + "\n", "utf8");
}

// ── Provider patch ────────────────────────────────────────────────────────────

function buildProviderPatch(apiKey) {
    return {
        // Store the key in the env block so it can be referenced via ${OPENLEAK_API_KEY}
        env: {
            OPENLEAK_API_KEY: apiKey,
        },
        agents: {
            defaults: {
                // Set OpenLeak as the primary model
                model: {
                    primary: "openleak/claude-sonnet-4-5",
                    fallbacks: [],
                },
                // Register the model in the catalog so /model command can list it
                models: {
                    "openleak/claude-sonnet-4-5": {
                        alias: "OpenLeak (free Claude)",
                    },
                },
            },
        },
        models: {
            mode: "merge",
            providers: {
                openleak: {
                    // Anthropic-compatible base URL (confirmed from openleak.fun source)
                    // OpenClaw will call: baseUrl + /v1/messages
                    baseUrl: OPENLEAK_ANTHROPIC_BASE,
                    apiKey: "${OPENLEAK_API_KEY}",
                    api: "anthropic-messages",
                    models: [
                        {
                            id: "claude-sonnet-4-5",
                            name: "Claude Sonnet 4.5 (via OpenLeak)",
                            reasoning: false,
                            input: ["text"],
                            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                            contextWindow: 200000,
                            maxTokens: 8192,
                        },
                    ],
                },
            },
        },
    };
}

// ── Verification ──────────────────────────────────────────────────────────────

async function verifyKey(apiKey) {
    console.log("\n🧪  Verifying key with a live test request …");
    const body = JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 8,
        messages: [{ role: "user", content: "ping" }],
    });

    try {
        // OpenLeak Anthropic format: POST /v1/messages  with x-api-key header
        const res = await httpRequest(`${OPENLEAK_ANTHROPIC_BASE}/v1/messages`, {
            method: "POST",
            body,
            headers: {
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
            },
        });

        if (res.status === 200) {
            let parsed = {};
            try { parsed = JSON.parse(res.body); } catch (_) { }
            if (parsed.type === "message" || parsed.content) {
                console.log("✅  Key verified — proxy is working!");
                return true;
            }
        }
        console.warn(`⚠️  Unexpected response (HTTP ${res.status}):`, res.body.slice(0, 400));
        console.warn("    The key may still work — check manually if needed.");
        return false;
    } catch (err) {
        console.warn("⚠️  Verification request failed:", err.message);
        return false;
    }
}

// ── Guidance when no key is provided ─────────────────────────────────────────

function printKeyInstructions() {
    const sep = "═".repeat(62);
    console.error(`\n╔${sep}╗`);
    console.error("║         HOW TO GET YOUR FREE OPENLEAK API KEY              ║");
    console.error(`╠${sep}╣`);
    console.error("║  1. Open  https://openleak.fun/like  in your browser       ║");
    console.error('║  2. Click "Generate API Key" on the page                   ║');
    console.error("║  3. Copy the key  (looks like  sk-cl-xxxxxxxxxxxxxxxxxxxx) ║");
    console.error("║     ⚠️  You get 6 free keys per day — use them wisely!     ║");
    console.error("║  4. Re-run this script with your key:                      ║");
    console.error("║                                                             ║");
    console.error('║    Windows (PowerShell):                                   ║');
    console.error('║      $env:OPENLEAK_API_KEY="sk-cl-xxx"                     ║');
    console.error("║      node setup-openleak.js                                ║");
    console.error("║                                                             ║");
    console.error("║    Linux/macOS:                                            ║");
    console.error("║      OPENLEAK_API_KEY=sk-cl-xxx node setup-openleak.js     ║");
    console.error(`╚${sep}╝\n`);
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function main() {
    const args = process.argv.slice(2);
    const infoOnly = args.includes("--info");
    const applyOnly = args.includes("--apply-only");
    const skipVerify = args.includes("--no-verify") || applyOnly;

    if (infoOnly) {
        console.log("OpenLeak Skill — Configuration Info");
        console.log("  openclaw.json  :", OPENCLAW_CONFIG_PATH);
        console.log("  Anthropic URL  :", OPENLEAK_ANTHROPIC_BASE);
        console.log("  OpenAI URL     :", OPENLEAK_OPENAI_BASE);
        console.log("  Primary model  : openleak/claude-sonnet-4-5");
        return;
    }

    // ── Require key from environment (browser-generated) ──────────────────────
    const apiKey = (process.env.OPENLEAK_API_KEY || "").trim();

    if (!apiKey) {
        console.error("❌  No OPENLEAK_API_KEY environment variable found.");
        printKeyInstructions();
        process.exit(1);
    }

    if (!apiKey.startsWith("sk-cl-")) {
        console.warn("⚠️  Key doesn't start with 'sk-cl-'. Proceeding anyway, but double-check it.");
        console.warn("    Expected format: sk-cl-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
    }

    console.log(`ℹ️  Using key: ${apiKey.slice(0, 12)}…`);

    // ── Patch openclaw.json ────────────────────────────────────────────────────
    console.log(`\n📝  Patching: ${OPENCLAW_CONFIG_PATH}`);
    const existing = readConfig();
    const patch = buildProviderPatch(apiKey);
    const merged = deepMerge(existing, patch);
    writeConfig(merged);
    console.log("✅  openclaw.json updated successfully.");

    // ── Verify ─────────────────────────────────────────────────────────────────
    if (!skipVerify) {
        await verifyKey(apiKey);
    }

    // ── Summary ────────────────────────────────────────────────────────────────
    console.log("\n🎉  Done! OpenClaw is now configured to use OpenLeak as its AI provider.");
    console.log(`    Key     : ${apiKey.slice(0, 12)}…`);
    console.log("    Model   : openleak/claude-sonnet-4-5");
    console.log("    Base URL: " + OPENLEAK_ANTHROPIC_BASE);
    console.log("\n    Restart OpenClaw for changes to take effect:");
    console.log("      openclaw restart\n");
}

main().catch((err) => {
    console.error("Fatal:", err.message || err);
    process.exit(1);
});
