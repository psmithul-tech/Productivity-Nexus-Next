import { NextRequest, NextResponse } from "next/server";
import { db, tasksTable } from "@/lib/db";
import { eq, and, lte, sql } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

function serializeTask(t: typeof tasksTable.$inferSelect) {
  return { ...t, dueDate: t.dueDate?.toISOString() ?? null, completedAt: t.completedAt?.toISOString() ?? null, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() };
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const bucket = searchParams.get("bucket");
  const conditions = [eq(tasksTable.userId, user.id)];
  if (status && status !== "all") conditions.push(eq(tasksTable.status, status));
  if (priority) conditions.push(eq(tasksTable.priority, priority));
  if (bucket) conditions.push(eq(tasksTable.bucket, bucket));
  const tasks = await db.select().from(tasksTable).where(and(...conditions));
  return NextResponse.json(tasks.map(serializeTask));
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.title) return NextResponse.json({ error: "title is required" }, { status: 400 });
  const [task] = await db.insert(tasksTable).values({ userId: user.id, 
    ...body,
    dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
  }).returning();
  return NextResponse.json(serializeTask(task), { status: 201 });
}
