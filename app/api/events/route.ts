import { NextRequest, NextResponse } from "next/server";
import { db, eventsTable } from "@/lib/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { auth } from "@/lib/auth";

function serializeEvent(e: typeof eventsTable.$inferSelect) {
  return { ...e, startTime: e.startTime.toISOString(), endTime: e.endTime.toISOString(), createdAt: e.createdAt.toISOString() };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const conditions = [];
  if (from) conditions.push(gte(eventsTable.startTime, new Date(from)));
  if (to) conditions.push(lte(eventsTable.endTime, new Date(to)));

  const events = conditions.length > 0
    ? await db.select().from(eventsTable).where(and(...conditions))
    : await db.select().from(eventsTable);

  return NextResponse.json(events.map(serializeEvent));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.title || !body.startTime || !body.endTime) {
    return NextResponse.json({ error: "title, startTime, endTime required" }, { status: 400 });
  }
  const [event] = await db.insert(eventsTable).values({
    ...body,
    startTime: new Date(body.startTime),
    endTime: new Date(body.endTime),
  }).returning();
  return NextResponse.json(serializeEvent(event), { status: 201 });
}
