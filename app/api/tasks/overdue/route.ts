import { NextRequest, NextResponse } from "next/server";
import { db, tasksTable } from "@/lib/db";
import { eq, and, lte } from "drizzle-orm";
import { auth } from "@/lib/auth";

function serializeTask(t: typeof tasksTable.$inferSelect) {
  return { ...t, dueDate: t.dueDate?.toISOString() ?? null, completedAt: t.completedAt?.toISOString() ?? null, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() };
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const now = new Date();
  const tasks = await db.select().from(tasksTable).where(and(eq(tasksTable.status, "active"), lte(tasksTable.dueDate!, now)));
  return NextResponse.json(tasks.map(serializeTask));
}
