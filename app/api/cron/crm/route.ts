import { AGENTS } from "@/lib/agents";
import { NextResponse } from "next/server";
import { db, contactsTable, settingsTable } from "@/lib/db";
import { eq, lt } from "drizzle-orm";
import { callOpenRouter } from "@/lib/openrouter";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const staleContacts = await db.select().from(contactsTable).where(
      lt(contactsTable.lastContactDate, threeMonthsAgo)
    );

    if (staleContacts.length === 0) {
      return NextResponse.json({ ok: true, message: "No stale contacts found." });
    }

    // Process each contact (or just take top 3 to avoid spam)
    const contactsToProcess = staleContacts.slice(0, 3);
    let notificationsSent = 0;

    for (const contact of contactsToProcess) {
      const [userSettings] = await db.select().from(settingsTable).where(eq(settingsTable.userId, contact.userId));
      
      if (!userSettings?.telegramChatId || !userSettings?.telegramBotToken) continue;

      const systemPrompt = `You are the Relationship Manager Agent for the user.
The user hasn't spoken to their contact "${contact.name}" in over 3 months.
Contact Notes: ${contact.notes || "No notes available."}

Draft a short, friendly message the user could send via WhatsApp or text to catch up. Only output the drafted message itself.`;

      const draftedMessage = await callOpenRouter("Draft a catch-up message.", systemPrompt, {
        model: AGENTS.RELATIONSHIP_MANAGER,
        temperature: 0.7
      });

      if (draftedMessage) {
        const pingMsg = `🫂 **CRM Alert**\nYou haven't spoken to ${contact.name} in 3+ months.\n\n**Suggested message to send:**\n_${draftedMessage}_`;
        await fetch(`https://api.telegram.org/bot${userSettings.telegramBotToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: userSettings.telegramChatId, text: pingMsg, parse_mode: "Markdown" })
        });
        notificationsSent++;
      }
    }

    return NextResponse.json({ ok: true, sent: notificationsSent });
  } catch (err: any) {
    console.error("[CRM Cron] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
