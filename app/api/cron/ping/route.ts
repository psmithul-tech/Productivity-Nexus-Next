import { AGENTS } from "@/lib/agents";
import { NextRequest, NextResponse } from "next/server";
import { db, settingsTable, tasksTable, eventsTable, reviewsTable, focusSessionsTable, habitLogsTable } from "@/lib/db";
import { eq, and, gte, lte, or, sql, desc, arrayContains } from "drizzle-orm";
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

// ── Build a beautiful rich template check-in (No AI) ──
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
  
  let greetings = ["Good day"];
  if (h24 < 12) greetings = ["Good morning", "Rise and shine", "Morning check-in"];
  else if (h24 < 17) greetings = ["Good afternoon", "Afternoon status", "Mid-day check-in"];
  else greetings = ["Good evening", "Evening wrap-up", "Nightly review"];

  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  lines.push(`✨ *${greeting}!* 🕒 It's *${userTimeStr}*\n`);
  
  if (overdue.length === 0 && endingSoon.length === 0 && upcoming.length === 0) {
    lines.push(`Everything is looking calm right now. Here is your overview:\n`);
  } else {
    lines.push(`Here is what needs your attention right now:\n`);
  }

  // Overdue tasks — URGENT
  if (overdue.length > 0) {
    lines.push(`🚨 *${overdue.length} Overdue Task${overdue.length > 1 ? "s" : ""}*`);
    overdue.forEach(t => {
      lines.push(`  ❌ ${t.title}${t.dueDate ? ` (was due ${formatTimeInTimeZone(new Date(t.dueDate), userTz)})` : ""}`);
    });
    lines.push("");
  }

  // Due soon
  if (endingSoon.length > 0) {
    lines.push(`⏰ *Due Soon*`);
    endingSoon.forEach(t => {
      const dueStr = t.dueDate ? formatTimeInTimeZone(new Date(t.dueDate), userTz) : "";
      lines.push(`  ⏳ ${t.title}${dueStr ? ` — ${dueStr}` : ""}`);
    });
    lines.push("");
  }

  // Upcoming events (next 60 min)
  if (upcoming.length > 0) {
    lines.push(`📅 *Coming Up Soon*`);
    upcoming.forEach(e => {
      lines.push(`  📌 ${e.title} at ${formatTime(new Date(e.startTime))}`);
    });
    lines.push("");
  }

  // Events today
  if (allEvents.length > 0) {
    lines.push(`📆 *${allEvents.length} Event${allEvents.length > 1 ? "s" : ""} Today*`);
    allEvents.forEach(e => {
      lines.push(`  🔹 ${e.title} at ${formatTime(new Date(e.startTime))}`);
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

  // Motivational closer
  const closers = [
    "💪 You've got this!",
    "🚀 Keep up the momentum!",
    "🌟 One task at a time!",
    "☕ Stay focused, stay sharp!",
    "🎯 Eyes on the prize!",
    "🔥 Let's make today count!",
  ];
  lines.push(`\n${closers[Math.floor(Date.now() / 60000) % closers.length]}`);

  // Bot follow up actions
  lines.push("\n🤖 *I can help with these! Just reply:*");
  lines.push("• _\"Mark the first task as done\"_");
  if (overdue.length > 0) lines.push("• _\"Snooze my overdue tasks to tomorrow\"_");
  lines.push("• _\"Add a task to call mom at 6pm\"_");
  lines.push("• _\"What's on my schedule for tomorrow?\"_");

  return lines.join("\n");
}

let lastGlobalCronRunMinute: string | null = null;

export async function GET(req: NextRequest) {
  if (
    req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}` &&
    process.env.NODE_ENV !== "development"
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const currentMinuteStr = now.toISOString().slice(0, 16);
    const forceSummary = req.nextUrl.searchParams.get("force") === "true";
    
    if (lastGlobalCronRunMinute === currentMinuteStr && !forceSummary) {
      return NextResponse.json({ success: true, skipped: true, reason: "Duplicate execution in the same minute" });
    }
    lastGlobalCronRunMinute = currentMinuteStr;

    const usersWithConfig = await db
      .select()
      .from(settingsTable)
      .where(
        sql`${settingsTable.discordWebhookUrl} IS NOT NULL OR (${settingsTable.telegramChatId} IS NOT NULL AND ${settingsTable.telegramBotToken} IS NOT NULL)`
      );

    // For exact minute tasks
    const startOfMinute = new Date(now);
    startOfMinute.setSeconds(0, 0);
    const endOfMinute = new Date(now);
    endOfMinute.setSeconds(59, 999);

    let processed = 0;
    let skipped = 0;
    let tasksNotified = 0;
    const notifiedTelegramChats = new Set<string>();
    const notifiedDiscordWebhooks = new Set<string>();

    for (const config of usersWithConfig) {
      // ── Quiet Hours Check ──
      const quietStart = config.quietHoursStart || "22:00";
      const quietEnd = config.quietHoursEnd || "08:00";
      
      const userTz = normalizeTimeZone(config.timezone);
      const currentTime = getMinutesInTimeZone(now, userTz);
      // Use UTC minutes for the frequency modulo so that 30/45 minute timezone offsets 
      // (like India +05:30) don't break the % 60 === 0 logic for hourly updates.
      const currentMinute = now.getUTCMinutes();
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

      const shouldSendDiscord = config.discordWebhookUrl && !notifiedDiscordWebhooks.has(config.discordWebhookUrl);
      const shouldSendTelegram = config.telegramChatId && config.telegramBotToken && !notifiedTelegramChats.has(config.telegramChatId);

      // If we've already notified both channels for this identity, skip
      if (!shouldSendDiscord && !shouldSendTelegram) {
        continue;
      }

      // ── EXACT-TIME TASK NOTIFICATIONS ──
      const exactDueTasks = await db.select().from(tasksTable).where(
        and(
          or(
            eq(tasksTable.userId, config.userId),
            (config.username ? eq(tasksTable.assignedTo, config.username) : undefined)
          ),
          eq(tasksTable.status, "active"),
          gte(tasksTable.dueDate, startOfMinute),
          lte(tasksTable.dueDate, endOfMinute)
        )
      );

      for (const task of exactDueTasks) {
        const priorityEmoji = task.priority === "urgent" ? "🚨" : task.priority === "high" ? "🔥" : "✅";
        const taskMsg = `${priorityEmoji} *Task Due Now*\n\n${task.title}`;
        
        if (shouldSendDiscord) await sendDiscordMessage(config.discordWebhookUrl!, taskMsg);
        if (shouldSendTelegram) {
          await sendTelegramMessage(config.telegramChatId!, config.telegramBotToken!, taskMsg);
        }
        tasksNotified++;
      }

      // ── EXACT-TIME EVENT NOTIFICATIONS ──
      const fifteenMinsFromNowStart = new Date(startOfMinute.getTime() + 15 * 60000);
      const fifteenMinsFromNowEnd = new Date(endOfMinute.getTime() + 15 * 60000);
      
      const exactUpcomingEvents = await db.select().from(eventsTable).where(
        and(
          eq(eventsTable.userId, config.userId),
          gte(eventsTable.startTime, fifteenMinsFromNowStart),
          lte(eventsTable.startTime, fifteenMinsFromNowEnd)
        )
      );

      for (const evt of exactUpcomingEvents) {
        const eventMsg = `📅 *Meeting Reminder*\n\n${evt.title} is starting in 15 minutes!`;
        if (shouldSendDiscord) await sendDiscordMessage(config.discordWebhookUrl!, eventMsg);
        if (shouldSendTelegram) {
          await sendTelegramMessage(config.telegramChatId!, config.telegramBotToken!, eventMsg);
        }
      }

      // ── PERIODIC SUMMARY NOTIFICATIONS ──
      const freq = parseInt(String(config.pingFrequency)) || 30;
      
      if (currentMinute % freq === 0 || forceSummary) {
        if (config.hourlyUpdatesEnabled !== false) {
          const tasks = await db.select().from(tasksTable).where(
            and(
              or(
                eq(tasksTable.userId, config.userId),
                (config.username ? eq(tasksTable.assignedTo, config.username) : undefined)
              ),
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

          // Build the rich template (No AI needed)
          const message = buildTemplateCheckin(
            userTimeStr, activeTasks, allEvents, upcoming, endingSoon, overdue, formatTime, userTz
          );

          if (shouldSendDiscord) await sendDiscordMessage(config.discordWebhookUrl!, message);
          if (shouldSendTelegram) {
            await sendTelegramMessage(config.telegramChatId!, config.telegramBotToken!, message);
          }
          processed++;
        }
      }

      // ── DAILY NEWS SUMMARY (Everyday 9 AM & 6 PM) ──
      const userDate = new Date(now.toLocaleString("en-US", { timeZone: userTz }));
      if ((userDate.getHours() === 9 || userDate.getHours() === 18) && userDate.getMinutes() === 0) {
        try {
          const { generateDailyNewsSummary } = await import("@/lib/news");
          const newsSummary = await generateDailyNewsSummary();
          const updateType = userDate.getHours() === 9 ? "Morning" : "Evening";
          
          if (shouldSendTelegram) {
            await sendTelegramMessage(
              config.telegramChatId!, 
              config.telegramBotToken!, 
              `📰 *Your ${updateType} News Update*\n\n${newsSummary}`
            );
          }
          if (shouldSendDiscord) {
            await sendDiscordMessage(
              config.discordWebhookUrl!,
              `📰 **Your ${updateType} News Update**\n\n${newsSummary}`
            );
          }
        } catch (e) {
          console.error("Daily news cron error:", e);
        }
      }

      // ── WEEKLY AI REVIEW (Sunday 8 PM) ──
      if (userDate.getDay() === 0 && userDate.getHours() === 20 && userDate.getMinutes() === 0) {
        try {
          const [latestReview] = await db.select().from(reviewsTable).where(eq(reviewsTable.userId, config.userId)).orderBy(desc(reviewsTable.createdAt)).limit(1);
          let shouldGenerate = true;
          if (latestReview) {
            const daysSince = (now.getTime() - new Date(latestReview.createdAt).getTime()) / (1000 * 3600 * 24);
            if (daysSince < 6) shouldGenerate = false;
          }

          if (shouldGenerate) {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            
            const completedTasks = await db.select().from(tasksTable).where(and(eq(tasksTable.userId, config.userId), eq(tasksTable.status, "completed"), gte(tasksTable.completedAt, oneWeekAgo)));
            const focusSessions = await db.select().from(focusSessionsTable).where(and(eq(focusSessionsTable.userId, config.userId), eq(focusSessionsTable.status, "completed"), gte(focusSessionsTable.completedAt, oneWeekAgo)));
            const habitLogs = await db.select().from(habitLogsTable).where(gte(habitLogsTable.createdAt, oneWeekAgo));
            
            const totalFocusMinutes = focusSessions.reduce((acc, s) => acc + s.completedMinutes, 0);
            
            const prompt = `<ROLE>
You are an elite productivity coach and data analyst.
</ROLE>

<TASK>
Generate a short, motivating Weekly Retrospective for the user based on their data from the last 7 days.
</TASK>

<DATA>
- Completed tasks: ${completedTasks.length} (${completedTasks.map(t => t.title).join(", ")})
- Focus sessions: ${focusSessions.length} (Total: ${totalFocusMinutes} minutes)
- Habits logged: ${habitLogs.length} instances
</DATA>

<FORMAT_CONSTRAINTS>
Write a 3-section markdown response:
1. **Highlights**: 2-3 bullet points celebrating wins.
2. **Analysis**: A short paragraph analyzing their focus time and task completion.
3. **Focus for Next Week**: 1-2 constructive suggestions.

- Keep the tone encouraging, premium, and concise.
- DO NOT use markdown headers (##). Use only bold text for section titles.
</FORMAT_CONSTRAINTS>`;

            const { callOpenRouter } = await import("@/lib/openrouter");
            const text = await callOpenRouter(prompt, undefined, { model: AGENTS.COMMUNICATIONS_MANAGER, temperature: 0.7, maxTokens: 2000 });
            
            if (text) {
               const stats = { tasks: completedTasks.length, focusMinutes: totalFocusMinutes, habits: habitLogs.length };
               await db.insert(reviewsTable).values({ userId: config.userId, text, stats: JSON.stringify(stats) });
               
               if (shouldSendTelegram) {
                 await sendTelegramMessage(config.telegramChatId!, config.telegramBotToken!, `📊 *Your Weekly Review is ready!*\n\n${text}`);
               }
            }
          }
        } catch (e) {
          console.error("Weekly review cron error:", e);
        }
      }
      
      if (shouldSendTelegram) notifiedTelegramChats.add(config.telegramChatId!);
      if (shouldSendDiscord) notifiedDiscordWebhooks.add(config.discordWebhookUrl!);
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
