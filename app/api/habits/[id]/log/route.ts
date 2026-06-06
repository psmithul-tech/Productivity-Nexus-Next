import { NextRequest, NextResponse } from "next/server";
import { db, habitLogsTable, habitsTable } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { id } = await params;
  const habitId = parseInt(id);

  const logs = await db.select().from(habitLogsTable).where(eq(habitLogsTable.habitId, habitId));
  return NextResponse.json(logs);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const habitId = parseInt(id);
  
  const body = await req.json();
  if (!body.date) return NextResponse.json({ error: "date is required" }, { status: 400 });

  // Check if log exists
  const [existing] = await db.select().from(habitLogsTable).where(
    and(
      eq(habitLogsTable.habitId, habitId),
      eq(habitLogsTable.date, body.date)
    )
  );

  if (existing) {
    // Toggle
    const [updated] = await db.update(habitLogsTable)
      .set({ completed: !existing.completed })
      .where(eq(habitLogsTable.id, existing.id))
      .returning();
      
    if (updated.completed) {
      const { awardXP, XP_AWARDS } = await import("@/lib/gamification");
      await awardXP(user.id, XP_AWARDS.HABIT_COMPLETED);
    }
    
    return NextResponse.json(updated);
  } else {
    // Create
    const [created] = await db.insert(habitLogsTable).values({
      habitId,
      date: body.date,
      completed: true
    }).returning();
    
    const { awardXP, XP_AWARDS } = await import("@/lib/gamification");
    await awardXP(user.id, XP_AWARDS.HABIT_COMPLETED);

    return NextResponse.json(created);
  }
}
