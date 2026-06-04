import { NextRequest, NextResponse } from "next/server";
import { db, tasksTable, eventsTable } from "@/lib/db";
import { eq, and, ilike, or } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ tasks: [], events: [] });

  const searchPattern = `%${q}%`;

  const [tasks, events] = await Promise.all([
    db.select().from(tasksTable).where(
      and(
        eq(tasksTable.userId, user.id),
        or(
          ilike(tasksTable.title, searchPattern),
          ilike(tasksTable.description, searchPattern)
        )
      )
    ).limit(10),
    db.select().from(eventsTable).where(
      and(
        eq(eventsTable.userId, user.id),
        or(
          ilike(eventsTable.title, searchPattern),
          ilike(eventsTable.description, searchPattern)
        )
      )
    ).limit(10),
  ]);

  return NextResponse.json({
    tasks: tasks.map(t => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      bucket: t.bucket,
      status: t.status,
    })),
    events: events.map(e => ({
      id: e.id,
      title: e.title,
      startTime: e.startTime.toISOString(),
    })),
  });
}
