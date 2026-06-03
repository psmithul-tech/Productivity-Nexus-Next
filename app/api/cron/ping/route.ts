import { NextRequest, NextResponse } from "next/server";
import { db, settingsTable, tasksTable, eventsTable } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { fetchGoogleEvents } from "@/lib/google-calendar";
import { ai } from "@/lib/gemini";

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
      const activeTasks = tasks.filter(t => t.status === "active");

      // Check for tasks ending soon (due within the next 2 hours or overdue)
      const endingSoon = activeTasks.filter(t => {
        if (!t.dueDate) return false;
        const due = new Date(t.dueDate).getTime();
        const nowMs = now.getTime();
        const diffHours = (due - nowMs) / (1000 * 60 * 60);
        return diffHours <= 2; // overdue or due within 2 hours
      });

      const prompt = `You are Restia, the user's AI Chief of Staff.
It is currently ${formatTime(now)}. Write a personalized, warm hourly update for the user.
Keep it human-like, encouraging, and concise. Use markdown.
Here is their schedule for today:
Events: ${allEvents.length === 0 ? 'None' : JSON.stringify(allEvents.map(e => ({ title: e.title, time: formatTime(e.startTime) })))}
Tasks: ${activeTasks.length === 0 ? 'None' : JSON.stringify(activeTasks.map(t => ({ title: t.title, priority: t.priority, due: t.dueDate })))}
Tasks Ending Soon/Overdue: ${endingSoon.length === 0 ? 'None' : JSON.stringify(endingSoon.map(t => ({ title: t.title })))}

Format the message nicely with a greeting. If there are tasks ending soon, strongly emphasize them! If they have no tasks, encourage them to take it easy.`;

      let message = `🕒 *Hourly Update:*\n\nYou have ${allEvents.length} events and ${activeTasks.length} tasks scheduled for today.`;
      try {
        const aiRes = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: prompt,
        });
        if (aiRes.text) message = aiRes.text;
      } catch (err) {
        console.error("AI Cron Ping Error:", err);
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
