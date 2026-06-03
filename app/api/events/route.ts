import { NextRequest, NextResponse } from "next/server";
import { db, eventsTable } from "@/lib/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { fetchGoogleEvents } from "@/lib/google-calendar";

function serializeEvent(e: typeof eventsTable.$inferSelect) {
  return { ...e, startTime: e.startTime.toISOString(), endTime: e.endTime.toISOString(), createdAt: e.createdAt.toISOString() };
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const conditions = [eq(eventsTable.userId, user.id)];
  if (from) conditions.push(gte(eventsTable.startTime, new Date(from)));
  if (to) conditions.push(lte(eventsTable.endTime, new Date(to)));

  const events = await db.select().from(eventsTable).where(and(...conditions));
  
  let gcalEvents: any[] = [];
  if (from && to) {
    gcalEvents = await fetchGoogleEvents(user.id, new Date(from), new Date(to));
  }
  
  const allEvents = [
    ...events.map(serializeEvent), 
    ...gcalEvents.map(serializeEvent)
  ];

  return NextResponse.json(allEvents);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.title || !body.startTime || !body.endTime) {
    return NextResponse.json({ error: "title, startTime, endTime required" }, { status: 400 });
  }
  const [event] = await db.insert(eventsTable).values({ userId: user.id, 
    ...body,
    startTime: new Date(body.startTime),
    endTime: new Date(body.endTime),
  }).returning();
  return NextResponse.json(serializeEvent(event), { status: 201 });
}
