import { NextRequest, NextResponse } from "next/server";
import { db, tasksTable } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

function serializeTask(t: typeof tasksTable.$inferSelect) {
  return { ...t, dueDate: t.dueDate?.toISOString() ?? null, completedAt: t.completedAt?.toISOString() ?? null, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() };
}

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const [task] = await db.update(tasksTable).set({ status: "completed", completedAt: new Date() }).where(and(eq(tasksTable.id, parseInt(id)), eq(tasksTable.userId, user.id))).returning();
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(serializeTask(task));
}
