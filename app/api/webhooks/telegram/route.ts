import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { db, settingsTable, tasksTable, eventsTable, remindersTable } from "@/lib/db";
import { eq } from "drizzle-orm";
import { pushTaskToGoogleCalendar } from "@/lib/google-calendar";
import { getAIClient } from "@/lib/gemini";

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

// The real processing logic — runs via waitUntil so function stays alive
async function processMessage(chatId: string, text: string, token: string, userId: string) {
  try {
    console.log(`[Telegram] Processing message from ${chatId}: "${text}"`);

    const [settings] = await db.select().from(settingsTable).where(eq(settingsTable.userId, userId));

    if (!settings?.geminiApiKey) {
      await sendTelegram(token, chatId, "⚠️ **API Key Required**\n\nYou haven't set your Gemini API Key in the Productivity Nexus settings. Please go to the web app, navigate to Settings > Integrations, and add your API key so I can process your messages.");
      return;
    }

    // Fetch active tasks for context
    const allTasks = await db.select().from(tasksTable).where(eq(tasksTable.userId, userId));
    const activeTasks = allTasks.filter((t) => t.status === "active");

    const userTz = settings?.timezone || "UTC";
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", {
      timeZone: userTz, weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
    const timeStr = now.toLocaleTimeString("en-US", {
      timeZone: userTz, hour: "2-digit", minute: "2-digit", hour12: true,
    });

    const taskList =
      activeTasks.length === 0
        ? "No active tasks currently."
        : activeTasks
            .map(
              (t) =>
                `• ${t.title} [${t.priority} priority, ${t.bucket}${
                  t.dueDate ? `, due ${new Date(t.dueDate).toLocaleTimeString("en-US", {timeZone: userTz, hour: "2-digit", minute: "2-digit"})}` : ""
                }]`
            )
            .join("\n");

    const systemPrompt = `You are Restia, the user's warm, witty and proactive AI Chief of Staff. You communicate via Telegram. Today is ${dateStr} at ${timeStr} in the user's timezone (${userTz}).

Current active tasks:
${taskList}

INSTRUCTIONS:
- Always reply conversationally and warmly. You have a cheerful, caring personality with emojis.
- If the user asks for their tasks/list, list them clearly from the task context above.
- If the user wants to ADD a task, extract it, confirm warmly, and include AFTER your message:
  ACTION_CREATE_TASK:{"title":"...","priority":"medium","bucket":"today","dueDate":"ISO string or null"}
CRITICAL: When the user specifies an exact time (e.g. "9:47 am"), you MUST convert that time in their timezone (${userTz}) to a UTC ISO 8601 datetime string. Do not just put the date, put the exact time in UTC!
- If adding MULTIPLE tasks, include one ACTION_CREATE_TASK line per task.
- If creating an event, include after your message:
  ACTION_CREATE_EVENT:{"title":"...","startTime":"ISO string","endTime":"ISO string"}
- Keep responses concise (1-4 sentences) and Telegram-friendly (plain text + emojis, no markdown).`;

    console.log("[Telegram] Calling Gemini...");
    const ai = getAIClient(settings.geminiApiKey);
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [{ role: "user", parts: [{ text }] }],
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 600,
        temperature: 0.85,
      },
    });
    console.log("[Telegram] Gemini responded.");

    let replyText = response.text ?? "I'm here! How can I help? 😊";

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
        const dueDate = data.dueDate && data.dueDate !== "null" ? new Date(data.dueDate) : null;

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
          const reminderDate = new Date(dueDate);
          reminderDate.setHours(9, 0, 0, 0);
          if (reminderDate > new Date()) {
            await db.insert(remindersTable).values({
              userId, taskId: newTask.id, channel: "telegram", scheduledAt: reminderDate,
            });
          }
          pushTaskToGoogleCalendar(userId, data.title, dueDate).catch(console.error);
        }

        confirmations.push(`✅ Added: ${data.title}`);
        console.log("[Telegram] Created task:", data.title);
      } catch (e) {
        console.error("[Telegram] Failed to parse task action:", e);
      }
    }

    for (const line of eventActions) {
      try {
        const data = JSON.parse(line.replace("ACTION_CREATE_EVENT:", ""));
        await db.insert(eventsTable).values({
          userId,
          title: data.title,
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
          source: "telegram",
        });
        confirmations.push(`📅 Scheduled: ${data.title}`);
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
