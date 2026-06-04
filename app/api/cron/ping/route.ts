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

// ── Model Strategy ──
// Use the cheapest model with highest rate limits for periodic check-ins.
// gemini-3.1-flash-lite: 15 RPM, 500 RPD (best for cron)
// gemini-2.5-flash: 5 RPM, 20 RPD (reserved for task parsing / conversations)
const CHECKIN_MODEL = "gemini-3.1-flash-lite";
const CHECKIN_FALLBACK_MODEL = "gemini-2.5-flash-lite";

async function sendTelegramMessage(chatId: string, botToken: string, message: string) {
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

// ── Build a rich template check-in (no AI needed) ──
function buildTemplateCheckin(
  userTimeStr: string,
  activeTasks: any[],
  allEvents: any[],
  upcoming: any[],
  endingSoon: any[],
  overdue: any[],
  formatTime: (d: Date) => string,
  userTz: string,
): string {
  const lines: string[] = [];

  // Time-appropriate greeting
  const hour = parseInt(userTimeStr.split(":")[0]);
  const isPM = userTimeStr.includes("PM");
  const h24 = isPM && hour !== 12 ? hour + 12 : (!isPM && hour === 12 ? 0 : hour);
  
  let greeting = "Good day";
  if (h24 < 12) greeting = "Good morning";
  else if (h24 < 17) greeting = "Good afternoon";
  else greeting = "Good evening";

  lines.push(`${greeting}! 🕒 It's *${userTimeStr}*\n`);

  // Overdue tasks — URGENT
  if (overdue.length > 0) {
    lines.push(`🚨 *${overdue.length} Overdue Task${overdue.length > 1 ? "s" : ""}:*`);
    overdue.forEach(t => {
      lines.push(`  ⚠️ ${t.title}${t.dueDate ? ` (was due ${formatTimeInTimeZone(new Date(t.dueDate), userTz)})` : ""}`);
    });
    lines.push("");
  }

  // Due soon
  if (endingSoon.length > 0) {
    lines.push(`⏰ *Due Soon:*`);
    endingSoon.forEach(t => {
      const dueStr = t.dueDate ? formatTimeInTimeZone(new Date(t.dueDate), userTz) : "";
      lines.push(`  🔸 ${t.title}${dueStr ? ` — ${dueStr}` : ""}`);
    });
    lines.push("");
  }

  // Upcoming events (next 60 min)
  if (upcoming.length > 0) {
    lines.push(`📅 *Coming Up:*`);
    upcoming.forEach(e => {
      lines.push(`  📌 ${e.title} at ${formatTime(new Date(e.startTime))}`);
    });
    lines.push("");
  }

  // Active tasks summary
  if (activeTasks.length > 0) {
    const urgent = activeTasks.filter(t => t.priority === "urgent" || t.priority === "high");
    lines.push(`📋 *${activeTasks.length} Active Tasks* ${urgent.length > 0 ? `(${urgent.length} high priority)` : ""}`);
    
    // Show top 5 tasks
    const topTasks = activeTasks
      .sort((a, b) => {
        const pOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
        return (pOrder[a.priority] ?? 2) - (pOrder[b.priority] ?? 2);
      })
      .slice(0, 5);
    
    topTasks.forEach(t => {
      const emoji = t.priority === "urgent" ? "🔴" : t.priority === "high" ? "🟠" : t.priority === "medium" ? "🔵" : "⚪";
      const dueStr = t.dueDate ? ` · ${formatTimeInTimeZone(new Date(t.dueDate), userTz)}` : "";
      lines.push(`  ${emoji} ${t.title}${dueStr}`);
    });
    if (activeTasks.length > 5) {
      lines.push(`  _...and ${activeTasks.length - 5} more_`);
    }
    lines.push("");
  } else {
    lines.push("✨ *No active tasks* — enjoy the clear schedule!\n");
  }

  // Events today
  if (allEvents.length > 0) {
    lines.push(`📆 *${allEvents.length} Event${allEvents.length > 1 ? "s" : ""} Today*`);
    allEvents.forEach(e => {
      lines.push(`  📌 ${e.title} at ${formatTime(new Date(e.startTime))}`);
    });
  } else {
    lines.push("📆 No events scheduled today");
  }

  // Motivational closer
  const closers = [
    "\n💪 You've got this!",
    "\n🚀 Keep up the momentum!",
    "\n🌟 One task at a time!",
    "\n☕ Stay focused, stay sharp!",
    "\n🎯 Eyes on the prize!",
  ];
  lines.push(closers[Math.floor(Date.now() / 60000) % closers.length]);

  return lines.join("\n");
}

// ── Delay helper to avoid RPM limits ──
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
            return diffHours > 0 && diffHours <= 2;
          });

          const overdue = activeTasks.filter(t => {
            if (!t.dueDate) return false;
            return new Date(t.dueDate).getTime() < now.getTime();
          });

          // Build the rich template (always works, no AI needed)
          const templateMessage = buildTemplateCheckin(
            userTimeStr, activeTasks, allEvents, upcoming, endingSoon, overdue, formatTime, userTz
          );

          let message = templateMessage;
          
          // Only try AI if user has API key — use the cheap model
          if (config.geminiApiKey) {
            const localDateStr = formatDateInTimeZone(now, userTz);
            const prompt = `You are Restia, the user's AI Chief of Staff sending a periodic check-in on Telegram.

## CURRENT TIME (AUTHORITATIVE — DO NOT OVERRIDE)
current_time: "${userTimeStr}"
current_date: "${localDateStr}"
timezone: "${userTz}"

Write a warm, personalized check-in. Use the current_time above as ground truth — do NOT compute a different time.

Status:
- Overdue: ${overdue.length === 0 ? 'None' : JSON.stringify(overdue.map(t => ({ title: t.title, due: t.dueDate ? formatDateTimeInTimeZone(new Date(t.dueDate), userTz) : null })))}
- Due Soon (2hr): ${endingSoon.length === 0 ? 'None' : JSON.stringify(endingSoon.map(t => ({ title: t.title, due: t.dueDate ? formatTimeInTimeZone(new Date(t.dueDate), userTz) : null })))}
- Upcoming Events (60 min): ${upcoming.length === 0 ? 'None' : JSON.stringify(upcoming.map(e => ({ title: e.title, time: formatTime(new Date(e.startTime)) })))}
- All Today's Events: ${allEvents.length === 0 ? 'None' : JSON.stringify(allEvents.map(e => ({ title: e.title, time: formatTime(new Date(e.startTime)) })))}
- Active Tasks (${activeTasks.length}): ${activeTasks.length === 0 ? 'None' : JSON.stringify(activeTasks.slice(0, 8).map(t => ({ title: t.title, priority: t.priority, due: t.dueDate ? formatDateTimeInTimeZone(new Date(t.dueDate), userTz) : null })))}

Rules:
- Start with "*${userTimeStr} Check-in*" and a time-appropriate greeting — use the exact time "${userTimeStr}"
- If overdue tasks exist, start with ⚠️ warnings
- If upcoming events in next 30 min, give strong heads-up
- List tasks with priority emojis (🔴 urgent, 🟠 high, 🔵 medium, ⚪ low)
- Show due times for each task that has one
- End with a brief motivational line
- Keep it under 180 words
- Use single asterisks for *bold*, NOT double`;

            try {
              const ai = getAIClient(config.geminiApiKey);
              const MODELS = [CHECKIN_MODEL, CHECKIN_FALLBACK_MODEL, "gemma-4-31b"];
              let success = false;
              
              for (const model of MODELS) {
                try {
                  const aiRes = await ai.models.generateContent({
                    model: model,
                    contents: prompt,
                    config: { maxOutputTokens: 400, temperature: 0.8 },
                  });
                  if (aiRes.text) {
                    message = aiRes.text;
                    success = true;
                    console.log(`[Cron] Used model: ${model}`);
                    break;
                  }
                } catch (modelErr: any) {
                  if (modelErr.status === 429) {
                    console.warn(`[Cron] ${model} failed (429 Rate Limit), trying fallback...`);
                    continue;
                  }
                  throw modelErr;
                }
              }
              
              if (!success) {
                console.warn(`[Cron] All AI models failed, using template fallback.`);
              }
            } catch (err) {
              console.error("AI Cron Ping Error:", err);
              // message stays as templateMessage
            }
          }

          if (config.discordWebhookUrl) await sendDiscordMessage(config.discordWebhookUrl, message);
          if (config.telegramChatId && config.telegramBotToken) {
            await sendTelegramMessage(config.telegramChatId, config.telegramBotToken, message);
          }
          processed++;

          // Stagger API calls between users to avoid RPM limits
          if (processed < usersWithConfig.length) {
            await delay(5000); // 5 second gap between users
          }
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
