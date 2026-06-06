#!/usr/bin/env node
// Restia — CLI Monitor Dashboard
// Run: node monitor.js

const fs = require("fs");
const http = require("http");
const https = require("https");
const { execSync } = require("child_process");

// ── Config ─────────────────────────────────────────────────────────────────
const LOCAL_URL  = "http://localhost:3000";
const TUNNEL_LOG = "/tmp/tunnel.log";
const REFRESH_MS = 4000;
let CRON_SECRET = "";
try {
  CRON_SECRET = fs.readFileSync("/Users/mika/Documents/Calendar/nexus-next/.env.local", "utf8")
    .split("\n").find(l => l.startsWith("CRON_SECRET="))?.split("=")[1]?.trim().replace(/^"|"$/g, "") || "";
} catch {}

// ── ANSI helpers ────────────────────────────────────────────────────────────
const ESC   = "\x1b[";
const reset = "\x1b[0m";
const bold  = "\x1b[1m";
const dim   = "\x1b[2m";

const c = {
  purple:  s => `\x1b[38;5;135m${s}${reset}`,
  green:   s => `\x1b[38;5;82m${s}${reset}`,
  red:     s => `\x1b[38;5;196m${s}${reset}`,
  yellow:  s => `\x1b[38;5;220m${s}${reset}`,
  cyan:    s => `\x1b[38;5;51m${s}${reset}`,
  blue:    s => `\x1b[38;5;39m${s}${reset}`,
  white:   s => `\x1b[97m${s}${reset}`,
  gray:    s => `\x1b[38;5;240m${s}${reset}`,
  bgPurp:  s => `\x1b[48;5;54m\x1b[97m${s}${reset}`,
  bgGreen: s => `\x1b[48;5;22m\x1b[92m${s}${reset}`,
  bgRed:   s => `\x1b[48;5;88m\x1b[91m${s}${reset}`,
  bold:    s => `${bold}${s}${reset}`,
  dim:     s => `${dim}${s}${reset}`,
};

// ── State ───────────────────────────────────────────────────────────────────
let state = {
  health: null,
  tunnelUrl: null,
  lastChecked: null,
  requestCount: 0,
  errorCount: 0,
  history: [], // [{time, latency, status}]
  lastError: null,
};

// ── Fetch helpers ───────────────────────────────────────────────────────────
function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const start = Date.now();
    const req = lib.get(url, { timeout: 5000, ...options }, res => {
      let data = "";
      res.on("data", d => data += d);
      res.on("end", () => {
        try { resolve({ json: JSON.parse(data), latency: Date.now() - start, status: res.statusCode }); }
        catch { reject(new Error("Invalid JSON")); }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

// ── Read tunnel URL ─────────────────────────────────────────────────────────
function getTunnelUrl() {
  try {
    const res = execSync("curl -s http://127.0.0.1:4040/api/tunnels", { timeout: 1000 }).toString();
    const json = JSON.parse(res);
    return json.tunnels[0]?.public_url || null;
  } catch { return null; }
}

// ── Format uptime ───────────────────────────────────────────────────────────
function fmtUptime(s) {
  if (!s) return "—";
  s = Math.floor(s);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h ? `${h}h ${m}m` : m ? `${m}m ${sec}s` : `${sec}s`;
}

function fmtTime(d) {
  return d ? new Date(d).toLocaleTimeString("en-US", { hour12: true, hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";
}

// ── Latency bar ─────────────────────────────────────────────────────────────
function latencyBar(ms) {
  if (!ms) return c.gray("no data");
  const bar = ms < 100 ? c.green("▓▓▓▓▓ FAST")
            : ms < 300 ? c.yellow("▓▓▓▓░ GOOD")
            : ms < 800 ? c.yellow("▓▓▓░░ OK")
            :             c.red("▓▓░░░ SLOW");
  return `${bar}  ${c.gray(ms + "ms")}`;
}

// ── Sparkline ───────────────────────────────────────────────────────────────
function sparkline(history) {
  if (!history.length) return c.gray("no data yet");
  const BARS = ["▁","▂","▃","▄","▅","▆","▇","█"];
  const vals = history.slice(-30).map(h => h.latency || 0);
  const max = Math.max(...vals, 1);
  return vals.map(v => {
    const idx = Math.round((v / max) * (BARS.length - 1));
    const bar = BARS[idx];
    return v > 600 ? c.red(bar) : v > 200 ? c.yellow(bar) : c.green(bar);
  }).join("");
}

// ── Draw ────────────────────────────────────────────────────────────────────
function draw() {
  const cols = process.stdout.columns || 100;
  const line  = (char = "─") => c.gray(char.repeat(cols));
  const pad   = (s, n) => (s + " ".repeat(n)).slice(0, n);
  const rpad  = (s, n) => " ".repeat(Math.max(0, n - stripAnsi(s).length)) + s;

  function stripAnsi(s) {
    return s.replace(/\x1b\[[0-9;]*m/g, "");
  }

  // Clear screen
  process.stdout.write("\x1b[2J\x1b[H");

  const h = state.health;
  const alive = h?.status === "ok";

  // ── Header ─────────────────────────────────────────────────────────────
  const title = ` ⚡  RESTIA  —  AI Chief of Staff  —  Monitor `;
  const ts    = ` ${fmtTime(new Date())} `;
  const gap   = " ".repeat(Math.max(0, cols - stripAnsi(title).length - stripAnsi(ts).length));
  console.log(c.bgPurp(title) + c.gray(gap + ts));
  console.log(line());

  // ── Status row ──────────────────────────────────────────────────────────
  const statusBadge = alive ? c.bgGreen(" ● ONLINE ") : c.bgRed(" ✗ OFFLINE ");
  const dbBadge     = alive ? c.green("● DB Connected") : c.red("✗ DB Error");
  const uptime      = alive ? c.cyan("↑ " + fmtUptime(h?.uptime)) : "";
  console.log(`\n  ${statusBadge}  ${dbBadge}   ${uptime}\n`);

  // ── URLs ────────────────────────────────────────────────────────────────
  console.log(c.bold("  URLs"));
  console.log(`  ${c.gray("Local  ")}  ${c.cyan(LOCAL_URL)}`);
  if (state.tunnelUrl) {
    console.log(`  ${c.gray("Public ")}  ${c.purple(state.tunnelUrl)}  ${c.dim("(share with wife)")}`);
  } else {
    console.log(`  ${c.gray("Public ")}  ${c.yellow("⚠  Tunnel not running — start with: /tmp/ngrok http 3000")}`);
  }
  console.log();

  // ── Performance ─────────────────────────────────────────────────────────
  console.log(line("─"));
  console.log(c.bold("  Performance"));
  console.log(`  ${c.gray("DB Latency  ")}  ${latencyBar(h?.dbLatencyMs)}`);
  console.log(`  ${c.gray("History     ")}  ${sparkline(state.history)}`);
  console.log(`  ${c.gray("Requests    ")}  ${c.white(state.requestCount)}   ${c.gray("Errors:")}  ${state.errorCount > 0 ? c.red(state.errorCount) : c.green(state.errorCount)}`);
  console.log();

  // ── App Stats ───────────────────────────────────────────────────────────
  if (h?.stats) {
    console.log(line("─"));
    console.log(c.bold("  App Stats"));
    const s = h.stats;
    const col = Math.floor((cols - 4) / 4);
    const statBlock = (label, val, color) => `  ${c.gray(label)}\n  ${color(String(val))}`;
    console.log([
      `  ${c.gray("Active Tasks  ")} ${c.yellow(s.activeTasks)}`,
      `  ${c.gray("Completed     ")} ${c.green(s.completedTasks)}`,
      `  ${c.gray("Events        ")} ${c.blue(s.totalEvents)}`,
      `  ${c.gray("Reminders     ")} ${c.purple(s.pendingReminders)}`,
    ].join("   "));
    console.log();
  }

  // ── Integrations ────────────────────────────────────────────────────────
  if (h?.integrations) {
    console.log(line("─"));
    console.log(c.bold("  Integrations"));
    const i = h.integrations;
    const badge = (ok, name) => ok ? c.green(`✓ ${name}`) : c.red(`✗ ${name}`);
    console.log(`  ${badge(i.telegram, "Telegram")}   ${badge(i.discord, "Discord")}   ${badge(i.hourlyUpdates, "Hourly Updates")}`);
    console.log();
  }

  // ── Last Error ──────────────────────────────────────────────────────────
  if (state.lastError) {
    console.log(line("─"));
    console.log(`  ${c.red("Last Error:")}  ${c.gray(state.lastError)}`);
    console.log();
  }

  // ── Footer ──────────────────────────────────────────────────────────────
  console.log(line());
  const nextIn = Math.ceil(REFRESH_MS / 1000);
  console.log(c.dim(`  Refreshing every ${nextIn}s   Last checked: ${fmtTime(state.lastChecked)}   Ctrl+C to quit`));
}

// ── Tick ────────────────────────────────────────────────────────────────────
async function tick() {
  state.tunnelUrl = getTunnelUrl();
  state.requestCount++;

  try {
    const result = await fetchJson(`${LOCAL_URL}/api/health`);
    state.health = result.json;
    state.lastChecked = new Date();
    state.history.push({ time: Date.now(), latency: result.latency, status: result.status });
    if (state.history.length > 60) state.history.shift();
  } catch (err) {
    state.errorCount++;
    state.lastError = `${new Date().toLocaleTimeString()} — ${err.message}`;
    state.health = null;
  }

  draw();
}

// ── Main ────────────────────────────────────────────────────────────────────
process.stdout.write("\x1b[?25l"); // hide cursor
process.on("exit",   () => process.stdout.write("\x1b[?25h\x1b[2J\x1b[H"));
process.on("SIGINT", () => { process.stdout.write("\x1b[?25h\x1b[2J\x1b[H"); process.exit(0); });

// Handle resize
process.stdout.on("resize", draw);

console.log(c.purple("\n  Starting Restia Monitor...\n"));
tick();
setInterval(tick, REFRESH_MS);

// Local Cron Trigger disabled to prevent duplicate pings.
// Use ecosystem.config.js to manage the dedicated cron process.
// setInterval(async () => {
//   try {
//     const opts = CRON_SECRET ? { headers: { Authorization: `Bearer ${CRON_SECRET}` } } : {};
//     await fetchJson(`${LOCAL_URL}/api/cron/ping`, opts);
//     console.log(c.green("  [Cron] Sent periodic reminder update"));
//   } catch (e) {
//     // Ignore cron errors
//   }
// }, 60 * 1000);
