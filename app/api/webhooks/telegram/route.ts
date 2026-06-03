import { NextRequest, NextResponse } from "next/server";
import { db, settingsTable, tasksTable, eventsTable, remindersTable } from "@/lib/db";
import { eq } from "drizzle-orm";
import { pushTaskToGoogleCalendar } from "@/lib/google-calendar";
import { GoogleGenAI } from "@google/genai";

// Helper: send a message to Telegram
async function sendTelegram(token: string, chatId: string, text: string) {
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch (e) {
    console.error("Failed to send Telegram message:", e);
  }
}

// The real processing logic — runs after we've already returned 200 to Telegram
async function processMessage(chatId: string, text: string) {
  // 1. Find the user by their chat ID
  const [userSettings] = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.telegramChatId, chatId));

  if (!userSettings) {
    // Not linked yet — send them their chat ID
    // We can't send here without a token... but if they're messaging the bot,
    // the token must be set somewhere. Try to find any settings with this token.
    return; // Will be handled by the unlinked check below
  }

  const token = userSettings.telegramBotToken?.trim();
  if (!token) return;

  const userId = userSettings.userId;

  try {
    // 2. Fetch all tasks for context
    const allTasks = await db.select().from(tasksTable).where(eq(tasksTable.userId, userId));
    const activeTasks = allTasks.filter((t) => t.status === "active");

    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const timeStr = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const taskList =
      activeTasks.length === 0
        ? "No active tasks currently."
        : activeTasks
            .map(
              (t) =>
                `• ${t.title} [${t.priority} priority, ${t.bucket}${
                  t.dueDate ? `, due ${new Date(t.dueDate).toLocaleDateString()}` : ""
                }]`
            )
            .join("\n");

    const systemPrompt = `You are Restia, the user's warm, witty and proactive AI Chief of Staff. You communicate via Telegram. Today is ${dateStr} and the time is ${timeStr}.

Current active tasks:
${taskList}

INSTRUCTIONS:
- Always reply conversationally and warmly with emojis. You have a cheerful, caring personality.
- If the user asks for tasks, list them clearly from the context above.
- If the user wants to ADD a task, extract it and respond with a JSON block (and only a JSON block after your message) in this exact format:
  ACTION_CREATE_TASK:{"title":"...","priority":"medium","bucket":"today","dueDate":"ISO string or null"}
- If the user wants to ADD MULTIPLE tasks, include multiple ACTION_CREATE_TASK lines.
- If the user wants to CREATE AN EVENT, respond with:
  ACTION_CREATE_EVENT:{"title":"...","startTime":"ISO string","endTime":"ISO string"}
- Otherwise, just have a friendly conversation! Help them with productivity, motivation, or planning.
- Keep responses concise and Telegram-friendly (no long markdown, plain text + emojis).`;

    // 3. Call Gemini (no function tools — plain text is far more reliable and fast)
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [{ role: "user", parts: [{ text }] }],
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 800,
        temperature: 0.8,
      },
    });

    let replyText = response.text || "I'm here! How can I help you? 😊";

    // 4. Parse any structured actions from the AI response
    const actionLines = replyText.match(/ACTION_CREATE_TASK:\{[^}]+\}/g) || [];
    const eventLines = replyText.match(/ACTION_CREATE_EVENT:\{[^}]+\}/g) || [];

    // Remove action lines from the reply text shown to the user
    replyText = replyText
      .replace(/ACTION_CREATE_TASK:\{[^}]+\}/g, "")
      .replace(/ACTION_CREATE_EVENT:\{[^}]+\}/g, "")
      .trim();

    const confirmations: string[] = [];

    // Execute task creations
    for (const line of actionLines) {
      try {
        const jsonStr = line.replace("ACTION_CREATE_TASK:", "");
        const data = JSON.parse(jsonStr);
        const dueDate = data.dueDate ? new Date(data.dueDate) : null;

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

        if (dueDate) {
          const reminderDate = new Date(dueDate);
          reminderDate.setHours(9, 0, 0, 0);
          if (reminderDate > new Date()) {
            await db.insert(remindersTable).values({
              userId,
              taskId: newTask.id,
              channel: "telegram",
              scheduledAt: reminderDate,
            });
          }
          pushTaskToGoogleCalendar(userId, data.title, dueDate).catch(console.error);
        }

        confirmations.push(`✅ Added: ${data.title}`);
      } catch (e) {
        console.error("Failed to parse task action:", e);
      }
    }

    // Execute event creations
    for (const line of eventLines) {
      try {
        const jsonStr = line.replace("ACTION_CREATE_EVENT:", "");
        const data = JSON.parse(jsonStr);

        await db.insert(eventsTable).values({
          userId,
          title: data.title,
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
          source: "telegram",
        });

        confirmations.push(`📅 Scheduled: ${data.title}`);
      } catch (e) {
        console.error("Failed to parse event action:", e);
      }
    }

    if (confirmations.length > 0) {
      replyText = `${replyText}\n\n${confirmations.join("\n")}`;
    }

    if (!replyText) replyText = "Done! 😊";

    await sendTelegram(token, chatId, replyText);
  } catch (err: any) {
    console.error("Telegram process error:", err);
    try {
      await sendTelegram(token, chatId, `Sorry, I hit an error: ${err.message}. Try again! 😅`);
    } catch (_) {}
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Must be a text message
    if (!body.message?.text || !body.message?.chat) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(body.message.chat.id);
    const text = body.message.text as string;

    // Check if this chat is linked
    const [userSettings] = await db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.telegramChatId, chatId));

    if (!userSettings) {
      // Find token by any means — since they messaged the bot, the bot token is fixed.
      // Send them their chat ID so they can link it.
      // We need a token to reply. Without it, we can't. 
      // This is a setup issue — tell them to link in settings.
      console.log(`Unlinked Telegram chat: ${chatId}`);
      // Try to find any settings row to get the bot token
      const allSettings = await db.select().from(settingsTable);
      const tokenHolder = allSettings.find((s) => s.telegramBotToken);
      if (tokenHolder?.telegramBotToken) {
        await sendTelegram(
          tokenHolder.telegramBotToken.trim(),
          chatId,
          `👋 Hi! I'm Restia! I don't recognize this chat yet.\n\nYour Telegram Chat ID is:\n\`${chatId}\`\n\nPlease go to your Productivity Nexus Settings page and save this as your Chat ID, then click "Set Webhook & Test" again!`
        );
      }
      return NextResponse.json({ ok: true });
    }

    // ✅ CRITICAL: Use waitUntil to process in background so Telegram gets 200 immediately
    // This prevents Telegram from retrying because the request timed out.
    const runtime = (req as any)[Symbol.for("edge-runtime")];

    // Process in background using unblocked async execution
    processMessage(chatId, text).catch(console.error);

    // Return 200 immediately to Telegram
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Telegram webhook outer error:", err);
    return NextResponse.json({ ok: true });
  }
}
