import { AGENTS } from "@/lib/agents";
import { NextRequest, NextResponse } from "next/server";
import { db, conversations, messages, tasksTable } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

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
    let responseText = "";
    try {
      const { callOpenRouter } = await import("@/lib/openrouter");
      responseText = await callOpenRouter(`Summarize the following chat message into a 2-4 word conversation title. Message: "${content}"`, undefined, {
        model: AGENTS.CHIEF_OF_STAFF,
        temperature: 0.7,
      });
      if (responseText) {
        title = responseText.replace(/["']/g, "").trim();
      }
    } catch (err) {
      console.error("OpenRouter Title Generation Error:", err);
      title = content.substring(0, 20) + "...";
    }
  } catch (err) {
    console.error("Failed to generate title:", err);
  }

  const [conv] = await db.insert(conversations).values({ userId: user.id, title: title }).returning();
  return NextResponse.json({ ...conv, createdAt: conv.createdAt.toISOString() }, { status: 201 });
}
