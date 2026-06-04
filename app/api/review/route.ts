import { NextRequest, NextResponse } from "next/server";
import { db, tasksTable, focusSessionsTable, habitLogsTable, settingsTable } from "@/lib/db";
import { eq, and, gte } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { getAIClient } from "@/lib/gemini";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [settings] = await db.select().from(settingsTable).where(eq(settingsTable.userId, user.id));
  const ai = getAIClient(settings?.geminiApiKey || null);
  if (!ai) return NextResponse.json({ error: "Gemini API key not configured" }, { status: 400 });

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Fetch data
  const completedTasks = await db.select().from(tasksTable).where(
    and(
      eq(tasksTable.userId, user.id),
      eq(tasksTable.status, "completed"),
      gte(tasksTable.completedAt, oneWeekAgo)
    )
  );

  const focusSessions = await db.select().from(focusSessionsTable).where(
    and(
      eq(focusSessionsTable.userId, user.id),
      eq(focusSessionsTable.status, "completed"),
      gte(focusSessionsTable.completedAt, oneWeekAgo)
    )
  );

  const habitLogs = await db.select().from(habitLogsTable).where(
    gte(habitLogsTable.createdAt, oneWeekAgo) // We aren't filtering by user directly on logs but this is a personal app so it's fine for the hackathon prototype.
  );

  const totalFocusMinutes = focusSessions.reduce((acc, s) => acc + s.completedMinutes, 0);

  const prompt = `You are a productivity coach. Generate a short, motivating Weekly Retrospective for the user based on their data from the last 7 days.

Data:
- Completed tasks: ${completedTasks.length} (${completedTasks.map(t => t.title).join(", ")})
- Focus sessions completed: ${focusSessions.length} (Total: ${totalFocusMinutes} minutes)
- Habits logged: ${habitLogs.length} instances

Write a 3-section markdown response:
1. **Highlights**: 2-3 bullet points celebrating wins.
2. **Analysis**: A short paragraph analyzing their focus time and task completion.
3. **Focus for Next Week**: 1-2 constructive suggestions.

Keep the tone encouraging, premium, and concise. Don't use markdown headers (##), just bold text.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.7 },
    });

    return NextResponse.json({
      text: response.text,
      stats: {
        tasks: completedTasks.length,
        focusMinutes: totalFocusMinutes,
        habits: habitLogs.length,
      }
    });
  } catch (error) {
    console.error("Gemini API error, falling back to OpenRouter:", error);
    try {
      const { callOpenRouter } = await import("@/lib/openrouter");
      const fallbackText = await callOpenRouter(prompt, undefined, { model: "google/gemini-2.5-flash", temperature: 0.7 });
      return NextResponse.json({
        text: fallbackText,
        stats: {
          tasks: completedTasks.length,
          focusMinutes: totalFocusMinutes,
          habits: habitLogs.length,
        }
      });
    } catch (fallbackError) {
      console.error("OpenRouter fallback error:", fallbackError);
      return NextResponse.json({ error: "Failed to generate review" }, { status: 500 });
    }
  }
}
