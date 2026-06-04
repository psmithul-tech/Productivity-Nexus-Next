import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { db, settingsTable, tasksTable, eventsTable, remindersTable } from "@/lib/db";
import { eq } from "drizzle-orm";
import { pushTaskToGoogleCalendar } from "@/lib/google-calendar";
import { getAIClient } from "@/lib/gemini";
import { callOpenRouter } from "@/lib/openrouter";
import {
  formatDateInTimeZone,
  formatLocalIsoInTimeZone,
  formatTimeInTimeZone,
  normalizeTimeZone,
  parseDateTimeInTimeZone,
  timeOnDateInTimeZone,
} from "@/lib/timezone";

// Helper: send a message to Telegram
async function sendTelegram(token: string, chatId: string, text: string) {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!res.ok) {
    console.error("[Telegram] sendMessage failed:", await res.text());
  }
}

// Detect simple time/date queries that don't need AI
function isTimeQuery(text: string): boolean {
  const lower = text.toLowerCase().trim();
  const patterns = [
    /^what('?s| is) (the |my )?(current )?(time|date|day)/,
    /^(time|date|day)\??$/,
    /^what time/,
    /^what date/,
    /^what day/,
    /^tell me the (time|date)/,
    /^(current|my) (time|date)/,
  ];
  return patterns.some((p) => p.test(lower));
}

function buildTimeResponse(userTz: string): string {
  const now = new Date();
  const timeStr = formatTimeInTimeZone(now, userTz);
  const dateStr = formatDateInTimeZone(now, userTz);
  return `It's ${timeStr} on ${dateStr} ☀️`;
}

// The real processing logic — runs via waitUntil so function stays alive
async function processMessage(chatId: string, text: string, token: string, userId: string) {
  try {
    console.log(`[Telegram] Processing message from ${chatId}: "${text}"`);

    const [settings] = await db.select().from(settingsTable).where(eq(settingsTable.userId, userId));
    const userTz = normalizeTimeZone(settings?.timezone);
    const now = new Date();
    const timeStr = formatTimeInTimeZone(now, userTz);
    const dateStr = formatDateInTimeZone(now, userTz);
    const localIso = formatLocalIsoInTimeZone(now, userTz);

    // ── Handle simple time/date queries without AI ──
    if (isTimeQuery(text)) {
      await sendTelegram(token, chatId, buildTimeResponse(userTz));
      return;
    }

    if (!settings?.geminiApiKey) {
      await sendTelegram(token, chatId, "⚠️ **API Key Required**\n\nYou haven't set your Gemini API Key in the Productivity Nexus settings. Please go to the web app, navigate to Settings > Integrations, and add your API key so I can process your messages.");
      return;
    }

    // Fetch active tasks for context
    const allTasks = await db.select().from(tasksTable).where(eq(tasksTable.userId, userId));
    const activeTasks = allTasks.filter((t) => t.status === "active");

    const taskList =
      activeTasks.length === 0
        ? "No active tasks currently."
        : activeTasks
            .map(
              (t) =>
                `• ${t.title} [${t.priority} priority, ${t.bucket}${
                  t.dueDate ? `, due ${formatTimeInTimeZone(new Date(t.dueDate), userTz)}` : ""
                }]`
            )
            .join("\n");

    console.log(`[Telegram Debug] userTz: ${userTz}, timeStr: ${timeStr}, dateStr: ${dateStr}, localIso: ${localIso}`);

    // Build a prompt that gives Gemini NO room to compute its own time
    const systemPrompt = `You are Restia, the user's warm, witty and proactive AI Chief of Staff. You communicate via Telegram.

## CURRENT TIME (AUTHORITATIVE — DO NOT OVERRIDE)
current_datetime: "${localIso}"
current_time_display: "${timeStr}"
current_date_display: "${dateStr}"
timezone: "${userTz}"

YOU MUST TREAT THE ABOVE AS GROUND TRUTH. If the user asks what time it is, reply: "It's ${timeStr} on ${dateStr}". Do NOT compute or infer the time yourself.

## ACTIVE TASKS
${taskList}

## INSTRUCTIONS
- Always reply conversationally and warmly. You have a cheerful, caring personality with emojis.
- If the user asks for their tasks/list, list them clearly from the task context above.
- If the user asks what time or date it is, say exactly: "It's ${timeStr} on ${dateStr}" — do NOT calculate any other time.
- If the user wants to ADD a task, extract it, confirm warmly, and include AFTER your message:
  ACTION_CREATE_TASK:{"title":"...","priority":"medium","bucket":"today","dueDate":"YYYY-MM-DDTHH:mm:00 or null"}
  CRITICAL for dueDate: Output the time EXACTLY as the user says it in local time. If they say "10:20 AM", output "T10:20:00". If they say "3pm", output "T15:00:00". Use the date from current_datetime as the base date. NEVER append 'Z' or any timezone offset. NEVER convert to UTC.
- If adding MULTIPLE tasks, include one ACTION_CREATE_TASK line per task.
- If creating an event, include after your message:
  ACTION_CREATE_EVENT:{"title":"...","startTime":"YYYY-MM-DDTHH:mm:00","endTime":"YYYY-MM-DDTHH:mm:00"}
  Same rules: local time, no 'Z', no offset.
- Keep responses concise (1-4 sentences) and Telegram-friendly (plain text + emojis, no markdown).`;

    console.log("[Telegram] Calling OpenRouter (owl-alpha)...");
    
    let replyText = "I'm here! How can I help? 😊";
    
    try {
      const responseText = await callOpenRouter(text, systemPrompt, {
        model: "openrouter/owl-alpha",
        temperature: 0.7,
        maxTokens: 600,
      });
      replyText = responseText ?? replyText;
      console.log("[Telegram] OpenRouter responded.");
    } catch (err: any) {
      console.error("[Telegram] OpenRouter failed:", err);
      // Fallback if needed, though owl-alpha is robust
      replyText = "Sorry, I'm having trouble thinking right now. Please try again later.";
    }

    // Parse ACTION lines from response
    const taskActions = replyText.match(/ACTION_CREATE_TASK:\{[^\n]+\}/g) ?? [];
    const eventActions = replyText.match(/ACTION_CREATE_EVENT:\{[^\n]+\}/g) ?? [];

    // Strip action lines from visible reply
    replyText = replyText
      .replace(/ACTION_CREATE_TASK:\{[^\n]+\}/g, "")
      .replace(/ACTION_CREATE_EVENT:\{[^\n]+\}/g, "")
      .trim();

    const confirmations: string[] = [];

    for (const line of taskActions) {
      try {
        const data = JSON.parse(line.replace("ACTION_CREATE_TASK:", ""));
        let dueDate = null;
        if (data.dueDate && data.dueDate !== "null") {
          dueDate = parseDateTimeInTimeZone(data.dueDate, userTz);
          console.log(`[Telegram] Task dueDate: raw="${data.dueDate}" → UTC=${dueDate.toISOString()}`);
        }

        const [newTask] = await db
          .insert(tasksTable)
          .values({
            userId,
            title: data.title,
            priority: data.priority || "medium",
            bucket: data.bucket || "today",
            dueDate,
          })
          .returning({ id: tasksTable.id });

        if (dueDate && newTask) {
          const reminderDate = timeOnDateInTimeZone(dueDate, userTz, "09:00");
          if (reminderDate > new Date()) {
            await db.insert(remindersTable).values({
              userId, taskId: newTask.id, channel: "telegram", scheduledAt: reminderDate,
            });
          }
          pushTaskToGoogleCalendar(userId, data.title, dueDate).catch(console.error);
        }

        const dueStr = dueDate ? ` (due ${formatTimeInTimeZone(dueDate, userTz)})` : "";
        confirmations.push(`✅ Added: ${data.title}${dueStr}`);
        console.log("[Telegram] Created task:", data.title);
      } catch (e) {
        console.error("[Telegram] Failed to parse task action:", e);
      }
    }

    for (const line of eventActions) {
      try {
        const data = JSON.parse(line.replace("ACTION_CREATE_EVENT:", ""));
        const startTime = parseDateTimeInTimeZone(data.startTime, userTz);
        const endTime = parseDateTimeInTimeZone(data.endTime, userTz);
        await db.insert(eventsTable).values({
          userId,
          title: data.title,
          startTime,
          endTime,
          source: "telegram",
        });
        confirmations.push(`📅 Scheduled: ${data.title} (${formatTimeInTimeZone(startTime, userTz)} - ${formatTimeInTimeZone(endTime, userTz)})`);
      } catch (e) {
        console.error("[Telegram] Failed to parse event action:", e);
      }
    }

    if (confirmations.length > 0) {
      replyText = `${replyText}\n\n${confirmations.join("\n")}`;
    }

    if (!replyText) replyText = "Done! 😊";

    await sendTelegram(token, chatId, replyText);
    console.log("[Telegram] Reply sent to", chatId);
  } catch (err: any) {
    console.error("[Telegram] processMessage error:", err.message, err.stack);
    try {
      await sendTelegram(token, chatId, `Sorry, something went wrong on my end 😓 — ${err.message}`);
    } catch (_) {}
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[Telegram] Webhook received:", JSON.stringify(body).slice(0, 200));

    // Must be a text message
    if (!body.message?.text || !body.message?.chat) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(body.message.chat.id);
    const text = body.message.text as string;

    // Look up user by chat ID
    const [userSettings] = await db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.telegramChatId, chatId));

    if (!userSettings) {
      // Not linked — try to find the token from any settings row to reply
      const allSettings = await db.select().from(settingsTable);
      const tokenHolder = allSettings.find((s) => s.telegramBotToken);
      const token = tokenHolder?.telegramBotToken?.trim();
      if (token) {
        await sendTelegram(
          token,
          chatId,
          `👋 Hi! I'm Restia, but I don't recognize this chat yet.\n\nYour Telegram Chat ID is:\n${chatId}\n\nGo to Settings in your Productivity Nexus app, paste this ID in the "Telegram Chat ID" field and save!`
        );
      }
      return NextResponse.json({ ok: true });
    }

    const token = userSettings.telegramBotToken?.trim();
    const userId = userSettings.userId;

    if (!token) {
      console.error("[Telegram] No bot token found for user", userId);
      return NextResponse.json({ ok: true });
    }

    // ✅ Use waitUntil — keeps the function alive after sending 200 OK to Telegram
    waitUntil(processMessage(chatId, text, token, userId));

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[Telegram] Outer webhook error:", err.message);
    return NextResponse.json({ ok: true });
  }
}
