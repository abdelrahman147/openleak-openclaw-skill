#!/usr/bin/env node
/**
 * refresh-key.js
 * ─────────────────────────────────────────────────────────────────────────────
 * OpenClaw Skill: openleak-proxy
 *
 * Rotates the OpenLeak API key without touching any other config.
 * Called by the daily cron job or by the user saying "refresh my OpenLeak key".
 *
 * Usage:
 *   node refresh-key.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use strict";

// Delegate entirely to setup-openleak.js so logic is in one place.
// We pass --apply-only so it skips the verification step (faster for cron).
process.argv.push("--apply-only");

require("./setup-openleak.js");
