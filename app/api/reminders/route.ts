import { NextRequest, NextResponse } from "next/server";
import { db, remindersTable } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";

function serializeReminder(r: typeof remindersTable.$inferSelect) {
  return { ...r, scheduledAt: r.scheduledAt.toISOString(), snoozedUntil: r.snoozedUntil?.toISOString() ?? null, createdAt: r.createdAt.toISOString() };
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { eq } = await import("drizzle-orm");
  const { tasksTable } = await import("@/lib/db");
  
  const reminders = await db
    .select({
      id: remindersTable.id,
      userId: remindersTable.userId,
      taskId: remindersTable.taskId,
      channel: remindersTable.channel,
      scheduledAt: remindersTable.scheduledAt,
      status: remindersTable.status,
      reminderType: remindersTable.reminderType,
      tone: remindersTable.tone,
      snoozedUntil: remindersTable.snoozedUntil,
      createdAt: remindersTable.createdAt,
      taskTitle: tasksTable.title,
    })
    .from(remindersTable)
    .leftJoin(tasksTable, eq(remindersTable.taskId, tasksTable.id))
    .where(eq(remindersTable.userId, user.id));

  return NextResponse.json(reminders.map(r => ({
    ...r, 
    snoozeUntil: r.snoozedUntil?.toISOString() ?? null,
    scheduledAt: r.scheduledAt.toISOString(), 
    snoozedUntil: r.snoozedUntil?.toISOString() ?? null, 
    createdAt: r.createdAt.toISOString() 
  })));
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.taskId || !body.channel || !body.scheduledAt) {
    return NextResponse.json({ error: "taskId, channel, scheduledAt required" }, { status: 400 });
  }
  const [reminder] = await db.insert(remindersTable).values({ userId: user.id,  ...body, scheduledAt: new Date(body.scheduledAt) }).returning();
  return NextResponse.json(serializeReminder(reminder), { status: 201 });
}
