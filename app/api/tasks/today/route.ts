import { NextRequest, NextResponse } from "next/server";
import { db, tasksTable } from "@/lib/db";
import { eq, and, lte, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";

function serializeTask(t: typeof tasksTable.$inferSelect) {
  return { ...t, dueDate: t.dueDate?.toISOString() ?? null, completedAt: t.completedAt?.toISOString() ?? null, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const now = new Date();
  const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999);
  const tasks = await db.select().from(tasksTable).where(
    sql`(${tasksTable.bucket} = 'today' OR (${tasksTable.dueDate} <= ${endOfDay} AND ${tasksTable.status} = 'active'))`
  );
  return NextResponse.json(tasks.map(serializeTask));
}
