import { NextRequest, NextResponse } from "next/server";
import { db, settingsTable, tasksTable, eventsTable } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { fetchGoogleEvents } from "@/lib/google-calendar";

export async function GET(req: NextRequest) {
  // Ensure the request is authorized by Vercel Cron
  if (
    req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}` &&
    process.env.NODE_ENV !== "development"
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all users who have notifications configured
    const usersWithConfig = await db
      .select()
      .from(settingsTable)
      .where(
        sql`${settingsTable.discordWebhookUrl} IS NOT NULL OR (${settingsTable.telegramChatId} IS NOT NULL AND ${settingsTable.telegramBotToken} IS NOT NULL)`
      );

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    for (const config of usersWithConfig) {
      // Fetch Tasks for today
      const tasks = await db.select().from(tasksTable).where(
        and(
          eq(tasksTable.userId, config.userId),
          sql`(${tasksTable.bucket} = 'today' OR (${tasksTable.dueDate} <= ${endOfDay.toISOString()}::timestamp AND ${tasksTable.status} = 'active'))`
        )
      );

      // Fetch Events for today
      const events = await db.select().from(eventsTable).where(
        and(
          eq(eventsTable.userId, config.userId),
          sql`${eventsTable.startTime} >= ${startOfDay.toISOString()}::timestamp AND ${eventsTable.startTime} <= ${endOfDay.toISOString()}::timestamp`
        )
      );

      const gcalEvents = await fetchGoogleEvents(config.userId, startOfDay, endOfDay);
      const allEvents = [...events, ...gcalEvents].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

      // Format Message
      const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      let message = `☀️ *Good Morning! Here is your daily briefing:*\n\n`;
      
      message += `📅 *Events Today (${allEvents.length}):*\n`;
      if (allEvents.length === 0) {
        message += `_No events scheduled._\n`;
      } else {
        allEvents.forEach(e => {
          message += `- ${formatTime(e.startTime)}: ${e.title}\n`;
        });
      }

      message += `\n📝 *Tasks for Today (${tasks.length}):*\n`;
      const activeTasks = tasks.filter(t => t.status === "active");
      if (activeTasks.length === 0) {
        message += `_All tasks completed!_\n`;
      } else {
        activeTasks.forEach(t => {
          message += `- [ ] ${t.title}${t.priority === 'urgent' || t.priority === 'high' ? ' 🚨' : ''}\n`;
        });
      }

      // Send Discord Ping
      if (config.discordWebhookUrl) {
        try {
          await fetch(config.discordWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: message }),
          });
        } catch (e) {
          console.error(`Discord webhook failed for user ${config.userId}`, e);
        }
      }

      // Send Telegram Ping
      if (config.telegramChatId && config.telegramBotToken) {
        try {
          await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: config.telegramChatId,
              text: message,
              parse_mode: "Markdown",
            }),
          });
        } catch (e) {
          console.error(`Telegram webhook failed for user ${config.userId}`, e);
        }
      }
    }

    return NextResponse.json({ success: true, processed: usersWithConfig.length });
  } catch (error: any) {
    console.error("Cron Ping Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
