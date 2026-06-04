import { NextRequest, NextResponse } from "next/server";
import { db, tasksTable, focusSessionsTable, settingsTable } from "@/lib/db";
import { eq, and, gte, sql } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // We want data for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Get user's timezone if possible, otherwise fallback to UTC
    const [settings] = await db.select({ timezone: settingsTable.timezone }).from(settingsTable).where(eq(settingsTable.userId, user.id));
    const tz = settings?.timezone || "UTC";

    // 1. Get completed tasks from the last 7 days
    const completedTasks = await db
      .select({
        completedAt: tasksTable.completedAt,
      })
      .from(tasksTable)
      .where(
        and(
          eq(tasksTable.userId, user.id),
          eq(tasksTable.status, "completed"),
          gte(tasksTable.completedAt, sevenDaysAgo)
        )
      );

    // 2. Get focus sessions from the last 7 days
    const focusSessions = await db
      .select({
        completedAt: focusSessionsTable.completedAt,
        completedMinutes: focusSessionsTable.completedMinutes,
      })
      .from(focusSessionsTable)
      .where(
        and(
          eq(focusSessionsTable.userId, user.id),
          eq(focusSessionsTable.status, "completed"),
          gte(focusSessionsTable.completedAt, sevenDaysAgo)
        )
      );

    // Initialize the last 7 days with zero using local timezone date strings
    const days: Record<string, { date: string; tasks: number; focus: number }> = {};
    const result = [];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const localDateKey = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
      const displayDate = d.toLocaleDateString("en-US", { timeZone: tz, weekday: "short" });
      
      const dayObj = { date: displayDate, tasks: 0, focus: 0 };
      days[localDateKey] = dayObj;
      result.push(dayObj); // store by reference, so updating `days` updates `result`
    }

    // Assign tasks to days
    for (const task of completedTasks) {
      if (!task.completedAt) continue;
      const tDate = new Date(task.completedAt);
      const localDateKey = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(tDate);
      if (days[localDateKey]) {
        days[localDateKey].tasks += 1;
      }
    }

    // Assign focus sessions to days
    for (const session of focusSessions) {
      if (!session.completedAt) continue;
      const tDate = new Date(session.completedAt);
      const localDateKey = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(tDate);
      if (days[localDateKey]) {
        days[localDateKey].focus += session.completedMinutes;
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
