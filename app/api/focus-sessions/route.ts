import { NextRequest, NextResponse } from "next/server";
import { db, focusSessionsTable } from "@/lib/db";
import { eq, and, gte, desc } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const sessions = await db.select().from(focusSessionsTable)
    .where(and(eq(focusSessionsTable.userId, user.id), gte(focusSessionsTable.startedAt, startOfDay)))
    .orderBy(desc(focusSessionsTable.startedAt));

  return NextResponse.json(sessions.map(s => ({
    ...s,
    startedAt: s.startedAt.toISOString(),
    completedAt: s.completedAt?.toISOString() ?? null,
  })));
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { taskId, durationMinutes } = await req.json();

  const [session] = await db.insert(focusSessionsTable).values({
    userId: user.id,
    taskId: taskId || null,
    durationMinutes,
    status: "active",
  }).returning();

  return NextResponse.json({
    ...session,
    startedAt: session.startedAt.toISOString(),
    completedAt: null,
  }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, status, completedMinutes } = await req.json();

  const [updated] = await db.update(focusSessionsTable)
    .set({
      status,
      completedMinutes,
      completedAt: status === "completed" ? new Date() : null,
    })
    .where(and(eq(focusSessionsTable.id, id), eq(focusSessionsTable.userId, user.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...updated,
    startedAt: updated.startedAt.toISOString(),
    completedAt: updated.completedAt?.toISOString() ?? null,
  });
}
