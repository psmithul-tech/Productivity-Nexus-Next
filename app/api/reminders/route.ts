import { NextRequest, NextResponse } from "next/server";
import { db, remindersTable } from "@/lib/db";
import { auth } from "@/lib/auth";

function serializeReminder(r: typeof remindersTable.$inferSelect) {
  return { ...r, scheduledAt: r.scheduledAt.toISOString(), snoozedUntil: r.snoozedUntil?.toISOString() ?? null, createdAt: r.createdAt.toISOString() };
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const reminders = await db.select().from(remindersTable);
  return NextResponse.json(reminders.map(serializeReminder));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.taskId || !body.channel || !body.scheduledAt) {
    return NextResponse.json({ error: "taskId, channel, scheduledAt required" }, { status: 400 });
  }
  const [reminder] = await db.insert(remindersTable).values({ ...body, scheduledAt: new Date(body.scheduledAt) }).returning();
  return NextResponse.json(serializeReminder(reminder), { status: 201 });
}
