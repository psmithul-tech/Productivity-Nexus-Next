import { NextRequest, NextResponse } from "next/server";
import { db, conversations, messages, tasksTable } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { getAIClient, buildSystemPrompt } from "@/lib/gemini";
import { settingsTable } from "@/lib/db";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const convs = await db.select().from(conversations).where(eq(conversations.userId, user.id)).orderBy(conversations.createdAt);
  return NextResponse.json(convs.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })));
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { content } = await req.json();
  
  // Generate summary
  let title = "New Conversation";
  try {
    const [settings] = await db.select().from(settingsTable).where(eq(settingsTable.userId, user.id));
    if (settings?.geminiApiKey) {
      const ai = getAIClient(settings.geminiApiKey);
      const res = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: `Summarize the following chat message into a 2-4 word conversation title. Message: "${content}"`
      });
      if (res.text) {
        title = res.text.replace(/["']/g, "").trim();
      }
    } else {
      title = content.substring(0, 20) + "...";
    }
  } catch (err) {
    console.error("Failed to generate title:", err);
  }

  const [conv] = await db.insert(conversations).values({ userId: user.id, title: title }).returning();
  return NextResponse.json({ ...conv, createdAt: conv.createdAt.toISOString() }, { status: 201 });
}
