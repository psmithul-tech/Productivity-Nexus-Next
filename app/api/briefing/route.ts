import { NextResponse } from "next/server";
import { db, tasksTable, eventsTable, settingsTable } from "@/lib/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { getAIClient } from "@/lib/gemini";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get user settings for API key
  const [settings] = await db.select().from(settingsTable).where(eq(settingsTable.userId, user.id));
  if (!settings?.geminiApiKey) {
    return NextResponse.json({ briefing: null, reason: "no_api_key" });
  }

  const now = new Date();
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999);

  // Fetch today's data
  const [tasks, events] = await Promise.all([
    db.select().from(tasksTable).where(eq(tasksTable.userId, user.id)),
    db.select().from(eventsTable).where(
      and(eq(eventsTable.userId, user.id), gte(eventsTable.startTime, startOfDay), lte(eventsTable.startTime, endOfDay))
    ),
  ]);

  const activeTasks = tasks.filter(t => t.status === "active");
  const todayTasks = activeTasks.filter(t => t.bucket === "today");
  const overdueTasks = activeTasks.filter(t => t.dueDate && new Date(t.dueDate) < now);
  const urgentTasks = activeTasks.filter(t => t.priority === "urgent" || t.priority === "high");

  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const prompt = `You are Restia, the user's AI Chief of Staff. Generate a brief, personal morning briefing.

Current time: ${now.toLocaleString()}

Today's schedule:
${events.length === 0 ? "No events scheduled." : events.map(e => `- ${e.title} at ${new Date(e.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`).join("\n")}

Task overview:
- ${todayTasks.length} tasks in "today" bucket
- ${overdueTasks.length} overdue tasks
- ${urgentTasks.length} urgent/high priority tasks
- ${activeTasks.length} total active tasks

Write a concise 3-5 sentence briefing. Be warm but professional. Mention the most important items. If there are overdue tasks, gently flag them. End with a motivating note. Do NOT use markdown headers or bullet points — write flowing prose.`;

  try {
    const ai = getAIClient(settings.geminiApiKey);
    const res = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
    });
    return NextResponse.json({ briefing: res.text || "Have a great day!" });
  } catch (err: any) {
    return NextResponse.json({ briefing: null, error: err.message }, { status: 500 });
  }
}
