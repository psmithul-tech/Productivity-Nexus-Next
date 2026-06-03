import { NextRequest, NextResponse } from "next/server";
import { db, eventsTable } from "@/lib/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

function serializeEvent(e: typeof eventsTable.$inferSelect) {
  return { ...e, startTime: e.startTime.toISOString(), endTime: e.endTime.toISOString(), createdAt: e.createdAt.toISOString() };
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999);

  const events = await db.select().from(eventsTable).where(
    and(gte(eventsTable.startTime, startOfDay), lte(eventsTable.startTime, endOfDay))
  );
  const sorted = events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  const workStart = new Date(startOfDay); workStart.setHours(9, 0, 0, 0);
  const workEnd = new Date(startOfDay); workEnd.setHours(18, 0, 0, 0);
  const freeSlots = [];
  let cursor = workStart;
  for (const event of sorted) {
    if (event.startTime > cursor) {
      const dur = Math.round((event.startTime.getTime() - cursor.getTime()) / 60000);
      if (dur >= 15) freeSlots.push({ start: cursor.toISOString(), end: event.startTime.toISOString(), durationMinutes: dur });
    }
    if (event.endTime > cursor) cursor = event.endTime;
  }
  if (cursor < workEnd) {
    const dur = Math.round((workEnd.getTime() - cursor.getTime()) / 60000);
    if (dur >= 15) freeSlots.push({ start: cursor.toISOString(), end: workEnd.toISOString(), durationMinutes: dur });
  }
  const totalMeetingMinutes = sorted.reduce((s, e) => s + Math.round((e.endTime.getTime() - e.startTime.getTime()) / 60000), 0);
  const totalFreeMinutes = freeSlots.reduce((s, f) => s + f.durationMinutes, 0);

  return NextResponse.json({ events: sorted.map(serializeEvent), freeSlots, totalMeetingMinutes, totalFreeMinutes });
}
