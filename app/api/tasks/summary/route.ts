import { NextRequest, NextResponse } from "next/server";
import { db, tasksTable } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const all = await db.select().from(tasksTable);
  const now = new Date();
  const overdue = all.filter((t) => t.status === "active" && t.dueDate && new Date(t.dueDate) < now);
  const byPriority = { low: 0, medium: 0, high: 0, urgent: 0 };
  const byBucket = { today: 0, this_week: 0, upcoming: 0, waiting: 0, someday: 0 };
  for (const t of all) {
    if (t.priority in byPriority) byPriority[t.priority as keyof typeof byPriority]++;
    if (t.bucket in byBucket) byBucket[t.bucket as keyof typeof byBucket]++;
  }
  return NextResponse.json({
    total: all.length,
    active: all.filter((t) => t.status === "active").length,
    completed: all.filter((t) => t.status === "completed").length,
    overdue: overdue.length,
    byPriority,
    byBucket,
  });
}
