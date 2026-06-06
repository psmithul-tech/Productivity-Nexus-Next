import { AGENTS } from "@/lib/agents";
import { NextRequest, NextResponse } from "next/server";
import { db, settingsTable, tasksTable, eventsTable } from "@/lib/db";
import { eq, ilike, or } from "drizzle-orm";
import { callOpenRouter } from "@/lib/openrouter";
import { parseDateTimeInTimeZone, normalizeTimeZone } from "@/lib/timezone";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const from = formData.get("from") as string;
    const text = formData.get("text") as string;
    const to = formData.get("to") as string;

    if (!text || !from) {
      return NextResponse.json({ error: "Missing email content or sender" }, { status: 400 });
    }

    // Let's just do a naive lookup
    let [userSettings] = await db
      .select({ id: settingsTable.id, userId: settingsTable.userId, timezone: settingsTable.timezone, telegramChatId: settingsTable.telegramChatId, telegramBotToken: settingsTable.telegramBotToken })
      .from(settingsTable)
      .limit(1);

    // FIX: actually find user properly.
    const { usersTable } = await import("@/lib/db/schema");
    const matchedUsers = await db.select().from(usersTable).where(ilike(usersTable.email, `%${from.split('<').pop()?.replace('>','')}%`));
    
    if (matchedUsers.length === 0) {
      console.log("[Inbound Email] User not found for email:", from);
      return NextResponse.json({ ok: true, reason: "user_not_found" });
    }

    const userId = matchedUsers[0].id;
    [userSettings] = await db.select().from(settingsTable).where(eq(settingsTable.userId, String(userId)));

    const userTz = normalizeTimeZone(userSettings?.timezone);

    // Parse Agent (OWL Alpha)
    const systemPrompt = `<ROLE>You are an expert NLP Parser Agent.</ROLE>
<TASK>Extract action items, tasks, and calendar events from the provided email body.</TASK>
<INSTRUCTIONS>
1. Identify any implied or explicit tasks and events.
2. Return ONLY a valid JSON object matching the exact schema below.
3. DO NOT wrap the output in markdown blocks (e.g. \`\`\`json). Just the raw JSON.
</INSTRUCTIONS>
<SCHEMA>
{
  "tasks": [{ "title": "string", "dueDate": "YYYY-MM-DDTHH:MM:SS" | null, "priority": "high"|"medium"|"low" }],
  "events": [{ "title": "string", "startTime": "YYYY-MM-DDTHH:MM:SS", "endTime": "YYYY-MM-DDTHH:MM:SS" }]
}
</SCHEMA>`;

    const aiResult = await callOpenRouter(`From: ${from}\n\nEmail Body:\n${text}`, systemPrompt, {
      model: AGENTS.EMAIL_MANAGER,
      temperature: 0.1,
      jsonMode: true
    });

    const parsedJson = JSON.parse(aiResult.replace(/```json/g, "").replace(/```/g, "").trim());

    const tasks = parsedJson.tasks || [];
    const events = parsedJson.events || [];

    for (const t of tasks) {
      await db.insert(tasksTable).values({
        userId: String(userId),
        title: t.title,
        priority: t.priority || "medium",
        dueDate: t.dueDate ? parseDateTimeInTimeZone(t.dueDate, userTz) : null,
      });
    }

    for (const e of events) {
      if (e.startTime && e.endTime) {
        await db.insert(eventsTable).values({
          userId: String(userId),
          title: e.title,
          startTime: parseDateTimeInTimeZone(e.startTime, userTz),
          endTime: parseDateTimeInTimeZone(e.endTime, userTz),
          source: "email_parser",
        });
      }
    }

    // Ping user on telegram
    if (userSettings?.telegramChatId && userSettings?.telegramBotToken && (tasks.length > 0 || events.length > 0)) {
       const msg = `📧 **Smart Inbox Update**\nParsed email from: ${from}\n✅ Added ${tasks.length} tasks and ${events.length} events!`;
       await fetch(`https://api.telegram.org/bot${userSettings.telegramBotToken}/sendMessage`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ chat_id: userSettings.telegramChatId, text: msg, parse_mode: "Markdown" })
       });
    }

    return NextResponse.json({ ok: true, tasksAdded: tasks.length, eventsAdded: events.length });

  } catch (err: any) {
    console.error("[Inbound Email] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
