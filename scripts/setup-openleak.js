#!/usr/bin/env node
/**
 * setup-openleak.js
 * ─────────────────────────────────────────────────────────────────────────────
 * OpenClaw Skill: openleak-proxy
 *
 * Fully automatic setup — no browser, no copy-pasting.
 *
 * 1. Calls POST https://openleak.fun/api/generate-key  (1 free key/day per IP)
 * 2. Deep-merges the OpenLeak provider block into ~/.openclaw/openclaw.json
 * 3. Verifies the key with a live test request
 *
 * API Details (openleak.fun):
 *   Endpoint  : POST https://openleak.fun/api/generate-key
 *   Rate limit: 1 key per IP per day (resets midnight UTC)
 *   Key format: sk-cl-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (46 chars)
 *   Anthropic : https://openleak.fun         (x-api-key header)
 *   OpenAI    : https://openleak.fun/v1      (Authorization: Bearer header)
 *
 * Usage:
 *   node setup-openleak.js                   # auto-generate key + apply + verify
 *   node setup-openleak.js --apply-only      # skip verification
 *   node setup-openleak.js --info            # print config paths and exit
 *   OPENLEAK_API_KEY=sk-cl-xxx node setup-openleak.js  # use existing key
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use strict";

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

// ── Constants ─────────────────────────────────────────────────────────────────

const OPENLEAK_BASE = "https://openleak.fun";
const OPENLEAK_KEYGEN_URL = `${OPENLEAK_BASE}/api/generate-key`;
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
                "User-Agent": "openclaw-openleak-skill/2.0",
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
            .replace(/\/\/[^\n]*/g, "")    // strip // comments
            .replace(/,\s*([\]}])/g, "$1"); // strip trailing commas
        return JSON.parse(raw);
    } catch (e) {
        console.warn("⚠️  Could not parse existing openclaw.json — will overlay cleanly.");
        return {};
    }
}

function writeConfig(cfg) {
    const dir = path.dirname(OPENCLAW_CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(OPENCLAW_CONFIG_PATH, JSON.stringify(cfg, null, 2) + "\n", "utf8");
}

// ── Key generation ────────────────────────────────────────────────────────────

async function generateKey() {
    console.log("🔑  Requesting a free API key from openleak.fun …");
    console.log(`    Endpoint: POST ${OPENLEAK_KEYGEN_URL}`);

    let res;
    try {
        res = await httpRequest(OPENLEAK_KEYGEN_URL, { method: "POST" });
    } catch (err) {
        throw new Error(`Network error contacting openleak.fun: ${err.message}`);
    }

    let parsed;
    try {
        parsed = JSON.parse(res.body);
    } catch (_) {
        throw new Error(`openleak.fun returned non-JSON (HTTP ${res.status}): ${res.body.slice(0, 200)}`);
    }

    // Rate limited
    if (res.status === 429) {
        const reset = parsed.reset ? new Date(parsed.reset).toLocaleString() : "midnight UTC";
        console.error("\n⛔  Daily API key limit reached (1 per IP per day).");
        console.error(`    Resets at: ${reset}`);
        console.error("\n    Options:");
        console.error("      1. Wait until midnight UTC and run again.");
        console.error("      2. Visit https://openleak.fun/like in your browser (7 more keys/day there).");
        console.error("         Then re-run: OPENLEAK_API_KEY=sk-cl-xxx node setup-openleak.js\n");
        process.exit(1);
    }

    if (res.status !== 200 || !parsed.key) {
        throw new Error(
            `Unexpected response (HTTP ${res.status}): ${JSON.stringify(parsed).slice(0, 300)}`
        );
    }

    const remaining = typeof parsed.remaining === "number" ? parsed.remaining : "?";
    console.log(`✅  Got key!  (${remaining} API key(s) remaining today)`);
    return parsed.key;
}

// ── Provider config patch ─────────────────────────────────────────────────────

function buildProviderPatch(apiKey) {
    return {
        env: {
            OPENLEAK_API_KEY: apiKey,
        },
        agents: {
            defaults: {
                model: {
                    primary: "openleak/claude-sonnet-4-5",
                    fallbacks: [],
                },
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
                    // Anthropic-compatible base URL
                    baseUrl: OPENLEAK_BASE,
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
        const res = await httpRequest(`${OPENLEAK_BASE}/v1/messages`, {
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
        console.warn(`⚠️  Unexpected verify response (HTTP ${res.status}):`, res.body.slice(0, 300));
        return false;
    } catch (err) {
        console.warn("⚠️  Verification request failed:", err.message);
        return false;
    }
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function main() {
    const args = process.argv.slice(2);
    const infoOnly = args.includes("--info");
    const applyOnly = args.includes("--apply-only");
    const skipVerify = args.includes("--no-verify") || applyOnly;

    if (infoOnly) {
        console.log("OpenLeak Skill v2 — Info");
        console.log("  openclaw.json  :", OPENCLAW_CONFIG_PATH);
        console.log("  Key gen URL    :", OPENLEAK_KEYGEN_URL);
        console.log("  Anthropic URL  :", OPENLEAK_BASE);
        console.log("  OpenAI URL     :", `${OPENLEAK_BASE}/v1`);
        console.log("  Primary model  : openleak/claude-sonnet-4-5");
        console.log("  Rate limit     : 1 auto-generated key per IP per day");
        return;
    }

    // ── Use env key if provided, otherwise auto-generate ──────────────────────
    let apiKey = (process.env.OPENLEAK_API_KEY || "").trim();

    if (apiKey) {
        console.log(`ℹ️  Using key from OPENLEAK_API_KEY env var: ${apiKey.slice(0, 12)}…`);
    } else {
        apiKey = await generateKey();
    }

    // ── Patch openclaw.json ────────────────────────────────────────────────────
    console.log(`\n📝  Patching: ${OPENCLAW_CONFIG_PATH}`);
    const existing = readConfig();
    const patch = buildProviderPatch(apiKey);
    const merged = deepMerge(existing, patch);
    writeConfig(merged);
    console.log("✅  openclaw.json updated.");

    // ── Verify ─────────────────────────────────────────────────────────────────
    if (!skipVerify) {
        await verifyKey(apiKey);
    }

    // ── Summary ────────────────────────────────────────────────────────────────
    console.log("\n🎉  Done! OpenClaw is now using OpenLeak as its AI provider.");
    console.log(`    Key     : ${apiKey.slice(0, 12)}…`);
    console.log("    Model   : openleak/claude-sonnet-4-5 (free Claude Sonnet 4.5)");
    console.log("    Proxy   :", OPENLEAK_BASE);
    console.log("\n    Restart OpenClaw to apply:");
    console.log("      openclaw restart\n");
}

main().catch((err) => {
    console.error("\n❌  Fatal:", err.message || err);
    process.exit(1);
});
