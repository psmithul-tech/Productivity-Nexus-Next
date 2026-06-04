#!/usr/bin/env node
/**
 * Self-Cron: Pings /api/cron/ping every 30 minutes.
 * 
 * On Vercel, the cron is handled by vercel.json.
 * On a VPS or local machine, run this alongside your Next.js server:
 *   node cron.js
 * 
 * It respects quiet hours defined in the user's settings (fetched server-side).
 * The ping endpoint itself handles all the logic — this script just triggers it.
 */

const BASE_URL = process.env.CRON_BASE_URL || "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET || "dev-cron-secret";
const INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

async function ping() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  
  try {
    const res = await fetch(`${BASE_URL}/api/cron/ping`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${CRON_SECRET}`,
      },
    });
    
    const data = await res.json();
    console.log(`[${timeStr}] ✅ Ping sent — processed ${data.processed ?? 0} users`);
  } catch (err) {
    console.error(`[${timeStr}] ❌ Ping failed:`, err.message);
  }
}

// Run immediately on start
console.log(`🔔 Cron started — pinging ${BASE_URL}/api/cron/ping every 30 minutes`);
ping();

// Then every 30 minutes
setInterval(ping, INTERVAL_MS);
