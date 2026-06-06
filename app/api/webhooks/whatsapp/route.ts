import { AGENTS } from "@/lib/agents";
import { NextRequest, NextResponse } from "next/server";
import { db, settingsTable, draftsTable, eventsTable } from "@/lib/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { callOpenRouter } from "@/lib/openrouter";
import { startOfDayInTimeZone, normalizeTimeZone } from "@/lib/timezone";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Twilio WhatsApp payload usually comes as Form data, but let's assume JSON or Meta Graph API for this example
    const fromPhone = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from || body.From;
    const text = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body || body.Body;
    
    if (!fromPhone || !text) {
      return NextResponse.json({ ok: true });
    }

    // Since we don't map phone numbers to users yet, let's just pick the first user with a Telegram Chat ID for demo
    // In production, you'd match the 'To' number to a user account
    const allSettings = await db.select().from(settingsTable);
    const userSettings = allSettings.find(s => s.telegramChatId);
    if (!userSettings) return NextResponse.json({ ok: true });

    const userId = userSettings.userId;
    const userTz = normalizeTimeZone(userSettings.timezone);
    const now = new Date();

    // Context: Today's events
    const startOfDay = startOfDayInTimeZone(now, userTz);
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
    
    const todaysEvents = await db.select().from(eventsTable).where(
      and(eq(eventsTable.userId, userId), gte(eventsTable.startTime, startOfDay), lte(eventsTable.startTime, endOfDay))
    );
    const eventContext = todaysEvents.length === 0 ? "No events today." : todaysEvents.map(e => `- ${e.title} at ${new Date(e.startTime).toISOString()}`).join("\n");

    const systemPrompt = `You are the Communications Agent for the user. 
They received a WhatsApp message. Draft a helpful, concise reply based on their calendar today.
Calendar:
${eventContext}

Only output the exact drafted message. Do not include quotes or explanations.`;

    const draftedReply = await callOpenRouter(`From: ${fromPhone}\nMessage: ${text}`, systemPrompt, {
      model: AGENTS.WHATSAPP_MANAGER,
      temperature: 0.7
    });

    if (draftedReply) {
      await db.insert(draftsTable).values({
        userId,
        channel: "whatsapp",
        recipient: fromPhone,
        messageContent: draftedReply,
      });

      if (userSettings.telegramChatId && userSettings.telegramBotToken) {
        const pingMsg = `💬 **WhatsApp from ${fromPhone}:**\n_"${text}"_\n\n**Drafted Reply:**\n${draftedReply}\n\n_Reply with /approve_wa to send this (Coming soon)_`;
        await fetch(`https://api.telegram.org/bot${userSettings.telegramBotToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: userSettings.telegramChatId, text: pingMsg, parse_mode: "Markdown" })
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[WhatsApp Webhook] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
