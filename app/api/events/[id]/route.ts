import { NextRequest, NextResponse } from "next/server";
import { db, eventsTable } from "@/lib/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

function serializeEvent(e: typeof eventsTable.$inferSelect) {
  return { ...e, startTime: e.startTime.toISOString(), endTime: e.endTime.toISOString(), createdAt: e.createdAt.toISOString() };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, parseInt(id)));
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(serializeEvent(event));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const updates: Record<string, unknown> = { ...body };
  if (body.startTime) updates.startTime = new Date(body.startTime);
  if (body.endTime) updates.endTime = new Date(body.endTime);
  const [event] = await db.update(eventsTable).set(updates).where(eq(eventsTable.id, parseInt(id))).returning();
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(serializeEvent(event));
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.delete(eventsTable).where(eq(eventsTable.id, parseInt(id)));
  return new NextResponse(null, { status: 204 });
}
