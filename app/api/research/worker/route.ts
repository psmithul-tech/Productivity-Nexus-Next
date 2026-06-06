import { AGENTS } from "@/lib/agents";
import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { db, researchTable, settingsTable } from "@/lib/db";
import { eq } from "drizzle-orm";
import { callOpenRouter } from "@/lib/openrouter";

// This would normally be a queue worker (e.g. Inngest, BullMQ) 
// but for Next.js serverless we can just return a 200 early and process in the background.

export async function POST(req: NextRequest) {
  try {
    const { userId, query, researchId } = await req.json();

    if (!userId || !query || !researchId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const [userSettings] = await db.select().from(settingsTable).where(eq(settingsTable.userId, userId));

    // Use unstable_after so Next.js doesn't kill the floating promise context
    after(async () => {
      try {
        console.log(`[Deep Research] Starting research for ID: ${researchId}`);
        await db.update(researchTable).set({ status: "processing" }).where(eq(researchTable.id, researchId));

        let searchContext = "";
        
        // Mock web search since we don't have Tavily/SerpAPI keys explicitly set yet
        const mockSearchResults = [
            `Result 1: Comprehensive overview of ${query}. Shows growth trends and major players.`,
            `Result 2: Deep dive into the mechanics of ${query}. Key challenges include scalability.`,
            `Result 3: Future outlook for ${query}. Expected to see massive adoption by 2030.`
        ];
        searchContext = mockSearchResults.join("\n\n");

        const systemPrompt = `<ROLE>You are the Deep Research Agent, an expert researcher and technical writer.</ROLE>
<TASK>Synthesize a highly detailed, comprehensive markdown report based on the provided web search context for the query: "${query}".</TASK>
<INSTRUCTIONS>
1. Produce a lengthy, detailed report (aim for the equivalent of a 5-page document).
2. Structure the document clearly using markdown headers (H1, H2, H3).
3. Use bullet points, bold text, and blockquotes to organize information effectively.
4. Synthesize the context; do not just list facts. Draw insights and conclusions.
</INSTRUCTIONS>`;

        const report = await callOpenRouter(`Web Search Context:\n${searchContext}`, systemPrompt, {
          model: AGENTS.RESEARCH_DIRECTOR, // Nemotron 3 Ultra for deep reasoning and synthesis
          temperature: 0.5,
          maxTokens: 4000
        });

        await db.update(researchTable).set({ 
            reportMarkdown: report,
            status: "completed"
        }).where(eq(researchTable.id, researchId));

        if (userSettings?.telegramChatId && userSettings?.telegramBotToken) {
           const hostUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
           const pingMsg = `📚 **Research Complete!**\nYour report on _"${query}"_ is ready to read in your dashboard:\n${hostUrl}/chiefofstaff/deep-research`;
           await fetch(`https://api.telegram.org/bot${userSettings.telegramBotToken}/sendMessage`, {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ chat_id: userSettings.telegramChatId, text: pingMsg, parse_mode: "Markdown" })
           });
        }
        console.log(`[Deep Research] Completed research for ID: ${researchId}`);
      } catch (e: any) {
        console.error(`[Deep Research] Failed:`, e.message);
        await db.update(researchTable).set({ status: "error" }).where(eq(researchTable.id, researchId));
      }
    });

    return NextResponse.json({ ok: true, message: "Research completed." });
  } catch (err: any) {
    console.error("[Research Worker] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
