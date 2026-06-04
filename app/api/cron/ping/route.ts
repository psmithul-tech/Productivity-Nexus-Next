import { NextRequest, NextResponse } from "next/server";
import { db, settingsTable, tasksTable, eventsTable } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { getAIClient } from "@/lib/gemini";

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

    // For today events
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    let processed = 0;
    let skipped = 0;
    let tasksNotified = 0;

    for (const config of usersWithConfig) {
      // ── Quiet Hours Check ──
      const quietStart = config.quietHoursStart || "22:00";
      const quietEnd = config.quietHoursEnd || "08:00";
      
      const userTz = config.timezone || "UTC";
      const userNow = new Date(now.toLocaleString("en-US", { timeZone: userTz }));
      const currentHour = userNow.getHours();
      const currentMinute = userNow.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;
      
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
          sql`${tasksTable.dueDate} >= ${startOfMinute.toISOString()}::timestamp`,
          sql`${tasksTable.dueDate} <= ${endOfMinute.toISOString()}::timestamp`
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
      const freq = config.pingFrequency || 30;
      if (currentMinute % freq === 0) {
        if (config.hourlyUpdatesEnabled !== false) {
          const tasks = await db.select().from(tasksTable).where(
            and(
              eq(tasksTable.userId, config.userId),
              sql`(${tasksTable.bucket} = 'today' OR (${tasksTable.dueDate} <= ${endOfDay.toISOString()}::timestamp AND ${tasksTable.status} = 'active'))`
            )
          );

          const events = await db.select().from(eventsTable).where(
            and(
              eq(eventsTable.userId, config.userId),
              sql`${eventsTable.startTime} >= ${startOfDay.toISOString()}::timestamp AND ${eventsTable.startTime} <= ${endOfDay.toISOString()}::timestamp`
            )
          );

          const allEvents = events.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
          const formatTime = (d: Date) => d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: userTz });
          const activeTasks = tasks.filter(t => t.status === "active");
          const userTimeStr = userNow.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

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

          const prompt = `You are Restia, the user's AI Chief of Staff.
It is currently ${userTimeStr} in their timezone (${userTz}).
Write a personalized, warm half-hourly check-in for the user.
Keep it human-like, encouraging, and concise. Use markdown (use single asterisks *bold* instead of double).

Here is their current status:
Upcoming Events (next 60 min): ${upcoming.length === 0 ? 'None' : JSON.stringify(upcoming.map(e => ({ title: e.title, time: formatTime(new Date(e.startTime)) })))}
All Today's Events: ${allEvents.length === 0 ? 'None' : JSON.stringify(allEvents.map(e => ({ title: e.title, time: formatTime(new Date(e.startTime)) })))}
Active Tasks: ${activeTasks.length === 0 ? 'None' : JSON.stringify(activeTasks.map(t => ({ title: t.title, priority: t.priority, due: t.dueDate })))}
Tasks Due Soon/Overdue: ${endingSoon.length === 0 ? 'None' : JSON.stringify(endingSoon.map(t => ({ title: t.title })))}

Rules:
- Start with a time-appropriate greeting
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
