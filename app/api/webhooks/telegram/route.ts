import { AGENTS } from "@/lib/agents";
import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { db, settingsTable, tasksTable, eventsTable, remindersTable, conversations, messages, mealLogsTable, habitsTable, habitLogsTable, researchTable } from "@/lib/db";
import { eq, and, gte, or, ilike, desc } from "drizzle-orm";
import { pushTaskToGoogleCalendar } from "@/lib/google-calendar";
import { buildSystemPrompt, callOpenRouter, openaiTools } from "@/lib/openrouter";
import {
  formatDateInTimeZone,
  formatLocalIsoInTimeZone,
  formatTimeInTimeZone,
  normalizeTimeZone,
  parseDateTimeInTimeZone,
  timeOnDateInTimeZone,
  startOfDayInTimeZone,
} from "@/lib/timezone";

// Helper: send a message to Telegram
async function sendTelegram(token: string, chatId: string, text: string) {
  if (!text) text = "Done! 😊";
  if (text.length > 4000) text = text.substring(0, 4000) + "...";
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!res.ok) {
    console.error("[Telegram] sendMessage failed:", await res.text());
    return null;
  }
  const data = await res.json();
  return data.result?.message_id as number | undefined;
}

async function editTelegramMessage(token: string, chatId: string, messageId: number, text: string) {
  if (!text) text = "Done! 😊";
  if (text.length > 4000) text = text.substring(0, 4000) + "...";
  const res = await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text }),
  });
  if (!res.ok) {
    console.error("[Telegram] editMessageText failed:", await res.text());
    return false;
  }
  return true;
}

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

async function processMessage(chatId: string, text: string, token: string, userId: string, photoBase64?: string) {
  try {
    console.log(`[Telegram] Processing message from ${chatId}: "${text}" (Photo: ${!!photoBase64})`);

    const [settings] = await db.select().from(settingsTable).where(eq(settingsTable.userId, userId));
    const userTz = normalizeTimeZone(settings?.timezone);
    const now = new Date();

    if (isTimeQuery(text)) {
      await sendTelegram(token, chatId, buildTimeResponse(userTz));
      return;
    }

    if (/^(hi|hello|\/start)$/i.test(text.trim())) {
      const helpText = `👋 Hello! I am Restia, your AI Chief of Staff. Here is what I can do for you:
      
📝 *Task Management*: Add tasks, check what's due today, or mark things as done.
📅 *Calendar & Events*: Schedule meetings, check your upcoming schedule, or get reminders.
🍽️ *Health & Diet*: Send me a photo of your food and I'll analyze its calories and macros, or tell me what you ate!
🔥 *Habit Tracking*: Log your daily habits (e.g., "Logged gym").
📰 *News & Briefings*: Ask for your daily morning briefing or the latest news.
🔎 *Deep Research*: Ask me to dive deep into any topic and I'll generate a full report!
💬 *Pinging*: Ping other users easily.

Just talk to me naturally, or send me a photo!`;
      await sendTelegram(token, chatId, helpText);
      return;
    }

    const allTasks = await db.select().from(tasksTable).where(
      or(eq(tasksTable.userId, userId), (settings?.username ? eq(tasksTable.assignedTo, settings.username) : undefined))
    );
    const activeTasks = allTasks.filter((t) => t.status === "active");
    const taskList = activeTasks.length === 0 ? "No active tasks." : activeTasks.map(t => `• [ID:${t.id}] ${t.title} [${t.priority}, ${t.bucket}]`).join("\n");

    const allEvents = await db.select().from(eventsTable).where(and(eq(eventsTable.userId, userId), gte(eventsTable.endTime, startOfDayInTimeZone(now, userTz))));
    const eventList = allEvents.length === 0 ? "No upcoming events." : allEvents.map(e => `• [ID:${e.id}] ${e.title} (${formatTimeInTimeZone(new Date(e.startTime), userTz)} - ${formatTimeInTimeZone(new Date(e.endTime), userTz)})`).join("\n");

    // Load Chat History
    let [telegramConvo] = await db.select().from(conversations).where(and(eq(conversations.userId, userId), eq(conversations.title, "Telegram Chat")));
    if (!telegramConvo) {
      [telegramConvo] = await db.insert(conversations).values({ userId, title: "Telegram Chat" }).returning();
    }
    
    const dbMessages = await db.select().from(messages).where(eq(messages.conversationId, telegramConvo.id)).orderBy(desc(messages.createdAt)).limit(10);
    dbMessages.reverse();

    const history: any[] = dbMessages.map(m => ({
      role: m.role,
      content: m.content
    }));

    const systemPrompt = buildSystemPrompt(userTz, taskList, eventList) + 
    `\n\n<TELEGRAM_CONTEXT>
You are chatting with the user over Telegram. 
- Keep responses highly concise (1-4 sentences maximum).
- Maintain a warm, proactive tone and use relevant emojis.
- You have native tool access (logDiet, logHabit, createTask, createEvent, ping, getNews, startDeepResearch). 
- CRITICAL: Use the tools naturally and IMMEDIATELY when the user requests an action. 
- If the user sends food, or the Vision Agent extracts calories/macros, you MUST call the \`logDiet\` tool to save it to their database.
- When replying to a food image, provide a beautifully formatted detailed breakdown of EACH food item identified by the Vision Agent, then show the total macros, and confirm it's logged.
- If the user asks you to research, deep dive, or find info on a topic, you MUST call the \`startDeepResearch\` tool. DO NOT try to answer it yourself!
</TELEGRAM_CONTEXT>`;

    // Server-side failsafe for research commands to bypass LLM tool calling failures
    const lowerText = text.toLowerCase().trim();
    if (lowerText.startsWith("research ") || lowerText.startsWith("deep dive on ") || lowerText === "research" || lowerText.startsWith("do a deep dive on ")) {
      const query = text.replace(/^(do a deep dive on|deep dive on|research)\s*/i, "").trim() || "General topic";
      
      const { db, researchTable } = await import("@/lib/db");
      const [inserted] = await db.insert(researchTable).values({ userId, query }).returning();
      
      const host = process.env.NEXTAUTH_URL || "http://localhost:3000";
      fetch(`${host}/api/research/worker`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ userId, query, researchId: inserted.id })
      }).catch(err => console.error("Failed to start research worker", err));
      
      await sendTelegram(token, chatId, `🔎 Starting Deep Research on: _"${query}"_\nThis will take a few minutes. I'll ping you with a link when the report is ready!`);
      return;
    }

    let thinkingMsgId;
    if (photoBase64) {
      thinkingMsgId = await sendTelegram(token, chatId, "Scanning image with Vision Agent... 👁️");
      const { callOpenRouterVision } = await import("@/lib/vision");
      const visionPrompt = `<ROLE>You are an expert Vision Agent.</ROLE>
<TASK>Analyze this image.</TASK>
<INSTRUCTIONS>
1. Extract any visible text exactly as written.
2. Identify the main contents of the image clearly.
3. If it is food or a meal, provide a detailed breakdown of EACH food item visible on the plate, including its estimated portion size, calories, and macros (Protein, Carbs, Fat). 
4. Finally, provide a highly accurate estimation of the total calories and total macros for the entire meal.
</INSTRUCTIONS>`;
      const extracted = await callOpenRouterVision(photoBase64, visionPrompt, { model: AGENTS.VISION_AGENT });
      text = text ? `${text}\n\n[Vision Agent Extracted]: ${extracted}` : `[Vision Agent Extracted]: ${extracted}`;
      if (thinkingMsgId) await editTelegramMessage(token, chatId, thinkingMsgId, "Analyzing with Oracle... 🤔");
    } else {
      thinkingMsgId = await sendTelegram(token, chatId, "Let me think about that... 🤔");
    }
    
    let aiResponseText = "";
    
    let currentMessages = [...history, { role: "user", content: text }];
    
    let result = await callOpenRouter(currentMessages as any, systemPrompt, {
      model: AGENTS.CHIEF_OF_STAFF,
      temperature: 0.7,
      tools: openaiTools
    });

    let MAX_TOOL_CALLS = 5;
    let toolCallCount = 0;
    let confirmations: string[] = [];

    while (typeof result === 'object' && result !== null && result.functionCalls && toolCallCount < MAX_TOOL_CALLS) {
      toolCallCount++;
      const functionResponses = [];

      currentMessages.push({
        role: "assistant",
        content: result.text || "",
        tool_calls: result.functionCalls.map((fc: any, i: number) => ({
          id: `call_${i}`,
          type: "function",
          function: { name: fc.name, arguments: JSON.stringify(fc.args) }
        }))
      });

      for (const [i, call] of (result.functionCalls as any[]).entries()) {
        let callResult: any = { error: "Unknown function" };
        const args = call.args;

        try {
          if (call.name === "createTask") {
             const dueDate = args.dueDate ? parseDateTimeInTimeZone(args.dueDate, userTz) : null;
             await db.insert(tasksTable).values({ userId, title: args.title, priority: args.priority || "medium", bucket: args.bucket || "today", dueDate });
             callResult = { success: true };
             confirmations.push(`✅ Added task: ${args.title}`);
          } 
          else if (call.name === "createTasksBatch") {
             for (const t of args.tasks) {
                const dDate = t.dueDate ? parseDateTimeInTimeZone(t.dueDate, userTz) : null;
                await db.insert(tasksTable).values({ userId, title: t.title, priority: t.priority || "medium", bucket: t.bucket || "today", dueDate: dDate });
             }
             callResult = { success: true, count: args.tasks.length };
             confirmations.push(`✅ Added ${args.tasks.length} tasks.`);
          }
          else if (call.name === "createEvent") {
             const startTime = parseDateTimeInTimeZone(args.startTime, userTz);
             const endTime = parseDateTimeInTimeZone(args.endTime, userTz);
             await db.insert(eventsTable).values({ userId, title: args.title, startTime, endTime, source: "telegram" });
             callResult = { success: true };
             confirmations.push(`📅 Scheduled event: ${args.title}`);
          }
          else if (call.name === "logDiet") {
             await db.insert(mealLogsTable).values({ userId, mealType: args.mealType, foodItems: JSON.stringify(args.foodItems), calories: args.calories });
             callResult = { success: true };
             confirmations.push(`🍽️ Logged ${args.mealType} (${args.calories} kcal)`);
          }
          else if (call.name === "logHabit") {
             const userHabits = await db.select().from(habitsTable).where(eq(habitsTable.userId, userId));
             const habit = userHabits.find(h => h.name.toLowerCase().includes(args.habitName.toLowerCase()));
             if (habit) {
               await db.insert(habitLogsTable).values({ habitId: habit.id, date: formatLocalIsoInTimeZone(new Date(), userTz).split("T")[0], completed: true });
               callResult = { success: true, habitFound: habit.name };
               confirmations.push(`🔥 Marked habit done: ${habit.name}`);
             } else {
               callResult = { error: "Habit not found" };
             }
          }
          else if (call.name === "getNews") {
             const { generateDailyNewsSummary } = await import("@/lib/news");
             const news = await generateDailyNewsSummary();
             callResult = { news_summary: news };
          }
          else if (call.name === "ping") {
             const targetUsername = args.username?.trim();
             if (targetUsername) {
               const [targetSettings] = await db.select().from(settingsTable).where(or(ilike(settingsTable.username, targetUsername), ilike(settingsTable.telegramUsername, targetUsername)));
               if (targetSettings && targetSettings.telegramChatId && targetSettings.telegramBotToken) {
                 await sendTelegram(targetSettings.telegramBotToken, targetSettings.telegramChatId, `🔔 Ping from @${settings?.username || 'someone'}:\n\n${args.message}`);
                 callResult = { success: true };
                 confirmations.push(`✅ Pinged @${targetUsername}!`);
               } else {
                 callResult = { error: "Target user not found or Telegram not linked" };
               }
             }
          }
          else if (call.name === "watchAnime") {
             const host = process.env.NEXTAUTH_URL || "http://localhost:3000";
             callResult = { success: true, url: `${host}/streaming-god?q=${encodeURIComponent(args.query)}` };
             confirmations.push(`🎬 Ready to watch! Tap here to open Streaming God:\n${host}/streaming-god?q=${encodeURIComponent(args.query)}`);
          }
          else if (call.name === "startDeepResearch") {
             const [inserted] = await db.insert(researchTable).values({ userId, query: args.query }).returning();
             // Call the local worker
             const host = process.env.NEXTAUTH_URL || "http://localhost:3000";
             fetch(`${host}/api/research/worker`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, query: args.query, researchId: inserted.id })
             }).catch(err => console.error("Failed to start research worker", err));
             
             callResult = { success: true, message: "Research started." };
             confirmations.push(`🔎 Starting Deep Research on: _"${args.query}"_\nThis will take a few minutes. I'll ping you when the report is ready!`);
          }
          else {
             callResult = { error: "Function not implemented in telegram webhook yet." };
          }
        } catch (e: any) {
          callResult = { error: e.message };
        }

        functionResponses.push({
          tool_call_id: `call_${i}`,
          role: "tool",
          name: call.name,
          content: JSON.stringify(callResult)
        });
      }

      currentMessages.push(...functionResponses);
      
      result = await callOpenRouter(currentMessages as any, systemPrompt, {
        model: AGENTS.CHIEF_OF_STAFF,
        temperature: 0.7,
        tools: openaiTools
      });
    }

    aiResponseText = (typeof result === 'string') ? result : (result.text || "");
    
    if (confirmations.length > 0 && !aiResponseText.includes(confirmations[0])) {
       aiResponseText += "\n\n" + confirmations.join("\n");
    }

    if (!aiResponseText.trim()) {
      aiResponseText = "Done! 😊";
    }

    // Save to DB
    await db.insert(messages).values({ conversationId: telegramConvo.id, role: "user", content: text });
    await db.insert(messages).values({ conversationId: telegramConvo.id, role: "assistant", content: aiResponseText });

    if (thinkingMsgId) {
      const edited = await editTelegramMessage(token, chatId, thinkingMsgId, aiResponseText);
      if (!edited) {
        await sendTelegram(token, chatId, aiResponseText);
      }
    } else {
      await sendTelegram(token, chatId, aiResponseText);
    }
    
  } catch (err: any) {
    console.error("[Telegram] processMessage error:", err.message, err.stack);
    await sendTelegram(token, chatId, `Sorry, something went wrong on my end 😓 — ${err.message}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[Telegram] Webhook received:", JSON.stringify(body).slice(0, 200));

    const chatId = String(body.message.chat.id);
    let text = (body.message.text || body.message.caption || "") as string;
    const fromUsername = body.message.from?.username;

    // Look up user by chat ID
    let [userSettings] = await db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.telegramChatId, chatId));

    if (!userSettings && fromUsername) {
      // Try to map by username automatically
      const [matchedByUsername] = await db
        .select()
        .from(settingsTable)
        .where(
          or(
            ilike(settingsTable.username, fromUsername),
            ilike(settingsTable.telegramUsername, fromUsername)
          )
        );

      if (matchedByUsername) {
        // Auto-link
        await db.update(settingsTable)
          .set({ telegramChatId: chatId })
          .where(eq(settingsTable.id, matchedByUsername.id));
        userSettings = { ...matchedByUsername, telegramChatId: chatId };
      }
    }

    if (!userSettings) {
      // Not linked — try to find the token from any settings row to reply
      const allSettings = await db.select().from(settingsTable);
      const tokenHolder = allSettings.find((s) => s.telegramBotToken);
      const token = tokenHolder?.telegramBotToken?.trim();
      if (token) {
        await sendTelegram(
          token,
          chatId,
          `👋 Hi! I'm Restia, but I don't recognize this chat yet.\n\nYour Telegram Chat ID is:\n${chatId}\n\nGo to Settings in your Productivity Nexus app, paste this ID in the "Telegram Chat ID" field and save! Or ensure your Nexus username exactly matches your Telegram username (@${fromUsername || "username"}).`
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

    let photoBase64: string | undefined;
    const photoArray = body.message.photo;
    if (photoArray && photoArray.length > 0) {
      const photo = photoArray[photoArray.length - 1]; // largest
      const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${photo.file_id}`);
      const fileData = await fileRes.json();
      if (fileData.ok) {
        const filePath = fileData.result.file_path;
        const imgRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
        const arrayBuffer = await imgRes.arrayBuffer();
        const base64Str = Buffer.from(arrayBuffer).toString('base64');
        let mimeType = imgRes.headers.get("content-type") || "image/jpeg";
        if (mimeType === "application/octet-stream") {
          if (filePath.endsWith(".png")) mimeType = "image/png";
          else if (filePath.endsWith(".gif")) mimeType = "image/gif";
          else mimeType = "image/jpeg"; // Telegram photos are mostly jpg
        }
        photoBase64 = `data:${mimeType};base64,${base64Str}`;
      }
    }

    if (!text && !photoBase64) {
      return NextResponse.json({ ok: true });
    }

    // Fire and forget so Telegram receives 200 OK immediately and stops retrying
    after(async () => {
      await processMessage(chatId, text, token, userId, photoBase64).catch(err => {
        console.error("[Telegram] Unhandled background error:", err);
      });
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[Telegram] Outer webhook error:", err.message);
    return NextResponse.json({ ok: true });
  }
}
