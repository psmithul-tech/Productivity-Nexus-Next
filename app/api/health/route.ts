import { NextResponse } from "next/server";
import { db, tasksTable, eventsTable, remindersTable, settingsTable } from "@/lib/db";
import { sql, eq } from "drizzle-orm";

export async function GET() {
  const start = Date.now();
  try {
    const [taskRes, eventRes, reminderRes, settingsRes] = await Promise.all([
      db.execute(sql`SELECT status, COUNT(*) as count FROM tasks GROUP BY status`),
      db.execute(sql`SELECT COUNT(*) as count FROM events`),
      db.execute(sql`SELECT status, COUNT(*) as count FROM reminders GROUP BY status`),
      db.execute(sql`SELECT telegram_chat_id, discord_webhook_url, telegram_bot_token, hourly_updates_enabled FROM settings LIMIT 1`),
    ]);

    const taskRows = taskRes.rows as any[];
    const reminderRows = reminderRes.rows as any[];
    const settings = (settingsRes.rows as any[])[0] || {};

    const activeTasks = taskRows.find(r => r.status === 'active')?.count ?? 0;
    const completedTasks = taskRows.find(r => r.status === 'completed')?.count ?? 0;
    const totalEvents = (eventRes.rows as any[])[0]?.count ?? 0;
    const pendingReminders = reminderRows.find(r => r.status === 'pending')?.count ?? 0;

    return NextResponse.json({
      status: "ok",
      db: "connected",
      dbLatencyMs: Date.now() - start,
      uptime: process.uptime(),
      stats: {
        activeTasks: Number(activeTasks),
        completedTasks: Number(completedTasks),
        totalEvents: Number(totalEvents),
        pendingReminders: Number(pendingReminders),
      },
      integrations: {
        telegram: !!settings.telegram_chat_id && !!settings.telegram_bot_token,
        discord: !!settings.discord_webhook_url,
        hourlyUpdates: !!settings.hourly_updates_enabled,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({
      status: "error",
      message: err.message,
      dbLatencyMs: Date.now() - start,
    }, { status: 500 });
  }
}
