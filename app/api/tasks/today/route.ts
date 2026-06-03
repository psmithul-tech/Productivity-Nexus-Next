import { NextRequest, NextResponse } from "next/server";
import { db, tasksTable } from "@/lib/db";
import { eq, and, lte, sql } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

function serializeTask(t: typeof tasksTable.$inferSelect) {
  return { 
    ...t, 
    dueDate: t.dueDate?.toISOString() ?? null, 
    completedAt: t.completedAt?.toISOString() ?? null, 
    createdAt: (t.createdAt ?? new Date()).toISOString(), 
    updatedAt: (t.updatedAt ?? new Date()).toISOString() 
  };
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const now = new Date();
  const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999);
  const tasks = await db.select().from(tasksTable).where(
    and(
      eq(tasksTable.userId, user.id),
      sql`(${tasksTable.bucket} = 'today' OR (${tasksTable.dueDate} <= ${endOfDay.toISOString()}::timestamp AND ${tasksTable.status} = 'active'))`
    )
  );
  return NextResponse.json(tasks.map(serializeTask));
}
