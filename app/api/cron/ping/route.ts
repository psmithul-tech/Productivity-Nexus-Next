import { NextRequest, NextResponse } from "next/server";
import { db, settingsTable, tasksTable, eventsTable } from "@/lib/db";
import { eq, and, gte, lte, or, sql } from "drizzle-orm";
import { getAIClient } from "@/lib/gemini";
import {
  endOfDayInTimeZone,
  formatDateInTimeZone,
  formatDateTimeInTimeZone,
  formatTimeInTimeZone,
  getMinutesInTimeZone,
  normalizeTimeZone,
  startOfDayInTimeZone,
} from "@/lib/timezone";

export const dynamic = "force-dynamic";

async function sendTelegramMessage(chatId: string, botToken: string, message: string) {
  // Telegram Markdown (V1) doesn't support **bold**, only *bold*
  const safeMessage = message.replace(/\*\*/g, '*');
  
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: safeMessage,
        parse_mode: "Markdown",
      }),
    });
  } catch (e) {
    console.error("Telegram webhook failed:", e);
  }
}

async function sendDiscordMessage(webhookUrl: string, message: string) {
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });
  } catch (e) {
    console.error("Discord webhook failed:", e);
  }
}

export async function GET(req: NextRequest) {
  if (
    req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}` &&
    process.env.NODE_ENV !== "development"
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const usersWithConfig = await db
      .select()
      .from(settingsTable)
      .where(
        sql`${settingsTable.discordWebhookUrl} IS NOT NULL OR (${settingsTable.telegramChatId} IS NOT NULL AND ${settingsTable.telegramBotToken} IS NOT NULL)`
      );

    const now = new Date();
    
    // For exact minute tasks
    const startOfMinute = new Date(now);
    startOfMinute.setSeconds(0, 0);
    const endOfMinute = new Date(now);
    endOfMinute.setSeconds(59, 999);

    let processed = 0;
    let skipped = 0;
    let tasksNotified = 0;

    for (const config of usersWithConfig) {
      // ── Quiet Hours Check ──
      const quietStart = config.quietHoursStart || "22:00";
      const quietEnd = config.quietHoursEnd || "08:00";
      
      const userTz = normalizeTimeZone(config.timezone);
      const currentTime = getMinutesInTimeZone(now, userTz);
      const currentMinute = currentTime % 60;
      const startOfDay = startOfDayInTimeZone(now, userTz);
      const endOfDay = endOfDayInTimeZone(now, userTz);
      
      const [qsH, qsM] = quietStart.split(":").map(Number);
      const [qeH, qeM] = quietEnd.split(":").map(Number);
      const quietStartMinutes = qsH * 60 + qsM;
      const quietEndMinutes = qeH * 60 + qeM;
      
      let isQuietHour = false;
      if (quietStartMinutes > quietEndMinutes) {
        isQuietHour = currentTime >= quietStartMinutes || currentTime < quietEndMinutes;
      } else {
        isQuietHour = currentTime >= quietStartMinutes && currentTime < quietEndMinutes;
      }
      
      if (isQuietHour) {
        skipped++;
        continue;
      }

      // ── EXACT-TIME TASK NOTIFICATIONS ──
      const exactDueTasks = await db.select().from(tasksTable).where(
        and(
          eq(tasksTable.userId, config.userId),
          eq(tasksTable.status, "active"),
          gte(tasksTable.dueDate, startOfMinute),
          lte(tasksTable.dueDate, endOfMinute)
        )
      );

      for (const task of exactDueTasks) {
        const priorityEmoji = task.priority === "urgent" ? "🚨" : task.priority === "high" ? "🔥" : "✅";
        const taskMsg = `${priorityEmoji} *Task Due Now*\n\n${task.title}`;
        
        if (config.discordWebhookUrl) await sendDiscordMessage(config.discordWebhookUrl, taskMsg);
        if (config.telegramChatId && config.telegramBotToken) {
          await sendTelegramMessage(config.telegramChatId, config.telegramBotToken, taskMsg);
        }
        tasksNotified++;
      }

      // ── PERIODIC SUMMARY NOTIFICATIONS ──
      const freq = parseInt(String(config.pingFrequency)) || 30;
      if (currentMinute % freq === 0) {
        if (config.hourlyUpdatesEnabled !== false) {
          const tasks = await db.select().from(tasksTable).where(
            and(
              eq(tasksTable.userId, config.userId),
              eq(tasksTable.status, "active"),
              or(
                eq(tasksTable.bucket, "today"),
                lte(tasksTable.dueDate, endOfDay)
              )
            )
          );

          const events = await db.select().from(eventsTable).where(
            and(
              eq(eventsTable.userId, config.userId),
              gte(eventsTable.startTime, startOfDay),
              lte(eventsTable.startTime, endOfDay)
            )
          );

          const allEvents = events.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
          const formatTime = (d: Date) => formatTimeInTimeZone(d, userTz);
          const activeTasks = tasks.filter(t => t.status === "active");
          const userTimeStr = formatTimeInTimeZone(now, userTz);

          const upcoming = allEvents.filter(e => {
            const start = new Date(e.startTime).getTime();
            const diff = (start - now.getTime()) / (1000 * 60);
            return diff > 0 && diff <= 60;
          });

          const endingSoon = activeTasks.filter(t => {
            if (!t.dueDate) return false;
            const due = new Date(t.dueDate).getTime();
            const diffHours = (due - now.getTime()) / (1000 * 60 * 60);
            return diffHours <= 2;
          });

          const localDateStr = formatDateInTimeZone(now, userTz);
          const prompt = `You are Restia, the user's AI Chief of Staff.

## CURRENT TIME (AUTHORITATIVE — DO NOT OVERRIDE)
current_time: "${userTimeStr}"
current_date: "${localDateStr}"
timezone: "${userTz}"

Write a personalized, warm check-in for the user. Use the current_time above as ground truth.
Keep it human-like, encouraging, and concise. Use markdown (use single asterisks *bold* instead of double).

Here is their current status:
Upcoming Events (next 60 min): ${upcoming.length === 0 ? 'None' : JSON.stringify(upcoming.map(e => ({ title: e.title, time: formatTime(new Date(e.startTime)) })))}
All Today's Events: ${allEvents.length === 0 ? 'None' : JSON.stringify(allEvents.map(e => ({ title: e.title, time: formatTime(new Date(e.startTime)) })))}
Active Tasks: ${activeTasks.length === 0 ? 'None' : JSON.stringify(activeTasks.map(t => ({ title: t.title, priority: t.priority, due: t.dueDate ? formatDateTimeInTimeZone(new Date(t.dueDate), userTz) : null })))}
Tasks Due Soon/Overdue: ${endingSoon.length === 0 ? 'None' : JSON.stringify(endingSoon.map(t => ({ title: t.title })))}

Rules:
- Start with a time-appropriate greeting using current_time "${userTimeStr}" — do NOT compute a different time
- If there's an upcoming meeting in the next 30 min, STRONGLY warn about it
- If there are overdue/due-soon tasks, emphasize them with urgency
- Keep it under 200 words
- Format the message nicely with emoji`;

          let message = `🕒 *${userTimeStr} Check-in*\n\nYou have ${allEvents.length} events and ${activeTasks.length} active tasks today.`;
          
          if (!config.geminiApiKey) {
            message += "\n\n_(AI updates disabled. Add your Gemini API Key in Settings to enable Restia's personalized updates.)_";
          } else {
            try {
              const ai = getAIClient(config.geminiApiKey);
              const aiRes = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
              });
              if (aiRes.text) message = aiRes.text;
            } catch (err) {
              console.error("AI Cron Ping Error:", err);
            }
          }

          if (config.discordWebhookUrl) await sendDiscordMessage(config.discordWebhookUrl, message);
          if (config.telegramChatId && config.telegramBotToken) {
            await sendTelegramMessage(config.telegramChatId, config.telegramBotToken, message);
          }
          processed++;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed,
      skipped,
      tasksNotified,
      timestamp: now.toISOString()
    });
  } catch (error: any) {
    console.error("Cron Ping Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
