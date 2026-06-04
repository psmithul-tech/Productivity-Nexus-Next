import { NextRequest, NextResponse } from "next/server";
import { db, tasksTable, focusSessionsTable, habitLogsTable, settingsTable, reviewsTable } from "@/lib/db";
import { eq, and, gte, desc } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [settings] = await db.select().from(settingsTable).where(eq(settingsTable.userId, user.id));

  // Check if a review already exists
  const [latestReview] = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.userId, user.id))
    .orderBy(desc(reviewsTable.createdAt))
    .limit(1);

  if (latestReview) {
    return NextResponse.json({
      text: latestReview.text,
      stats: latestReview.stats ? JSON.parse(latestReview.stats) : null
    });
  }

  // If no review exists at all, generate the initial one
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
    gte(habitLogsTable.createdAt, oneWeekAgo)
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
    const { callOpenRouter } = await import("@/lib/openrouter");
    // Only use openrouter, limit tokens
    const text = await callOpenRouter(prompt, undefined, { model: "google/gemini-2.5-flash", temperature: 0.7, maxTokens: 2000 });
    
    if (!text) {
      throw new Error("Empty response from OpenRouter");
    }

    const stats = {
      tasks: completedTasks.length,
      focusMinutes: totalFocusMinutes,
      habits: habitLogs.length,
    };

    // Save initial review
    await db.insert(reviewsTable).values({
      userId: user.id,
      text,
      stats: JSON.stringify(stats)
    });

    return NextResponse.json({ text, stats });
  } catch (error) {
    console.error("OpenRouter API error:", error);
    return NextResponse.json({ error: "Failed to generate review" }, { status: 500 });
  }
}
