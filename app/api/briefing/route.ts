import { AGENTS } from "@/lib/agents";
import { NextResponse } from "next/server";
import { db, tasksTable, eventsTable, settingsTable } from "@/lib/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get user settings
  const [settings] = await db.select().from(settingsTable).where(eq(settingsTable.userId, user.id));

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

  const prompt = `<ROLE>You are Restia, the user's AI Chief of Staff.</ROLE>
<TASK>Generate a brief, highly personalized morning briefing.</TASK>
<CONTEXT_DATA>
- Current time: ${now.toLocaleString()}
- Today's schedule:
  ${events.length === 0 ? "No events scheduled." : events.map(e => `- ${e.title} at ${new Date(e.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`).join("\n  ")}
- Task overview:
  - ${todayTasks.length} tasks in "today" bucket
  - ${overdueTasks.length} overdue tasks
  - ${urgentTasks.length} urgent/high priority tasks
  - ${activeTasks.length} total active tasks
</CONTEXT_DATA>
<INSTRUCTIONS>
1. Write 3-5 concise, friendly sentences in flowing prose.
2. Highlight the most important items and gently flag overdue tasks.
3. Conclude with an inspiring note.
4. Do NOT use markdown headers or bullet points.
</INSTRUCTIONS>`;
  try {
    const { callOpenRouter } = await import("@/lib/openrouter");
    const briefingText = await callOpenRouter(prompt, undefined, {
      model: AGENTS.STRATEGIC_PLANNER,
      temperature: 0.7,
    });
    return NextResponse.json({ briefing: briefingText || "Have a great day!" });
  } catch (err: any) {
    return NextResponse.json({ briefing: null, error: err.message }, { status: 500 });
  }
}
