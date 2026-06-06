import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { RestiaHudClient } from "./hud-client";

// This tells Next.js not to cache this page so we always get fresh stats on load
export const dynamic = "force-dynamic";

export default async function RestiaCorePage() {
  const start = Date.now();
  let stats = {
    activeTasks: 0,
    completedTasks: 0,
    totalEvents: 0,
    pendingReminders: 0,
  };
  
  let dbLatencyMs = 0;
  
  try {
    const [taskRes, eventRes, reminderRes] = await Promise.all([
      db.execute(sql`SELECT status, COUNT(*) as count FROM tasks GROUP BY status`),
      db.execute(sql`SELECT COUNT(*) as count FROM events`),
      db.execute(sql`SELECT status, COUNT(*) as count FROM reminders GROUP BY status`),
    ]);

    const taskRows = taskRes.rows as any[];
    const reminderRows = reminderRes.rows as any[];

    stats.activeTasks = Number(taskRows.find(r => r.status === 'active')?.count ?? 0);
    stats.completedTasks = Number(taskRows.find(r => r.status === 'completed')?.count ?? 0);
    stats.totalEvents = Number((eventRes.rows as any[])[0]?.count ?? 0);
    stats.pendingReminders = Number(reminderRows.find(r => r.status === 'pending')?.count ?? 0);
    
    dbLatencyMs = Date.now() - start;
  } catch (err) {
    console.error("Failed to fetch initial stats for HUD", err);
  }

  const initialData = {
    uptime: process.uptime(),
    mem: process.memoryUsage(),
    dbLatencyMs,
    stats
  };

  return <RestiaHudClient initialData={initialData} />;
}
