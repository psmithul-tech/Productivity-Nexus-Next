import { NextRequest, NextResponse } from "next/server";
import { db, remindersTable } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

function serializeReminder(r: typeof remindersTable.$inferSelect) {
  return { ...r, scheduledAt: r.scheduledAt.toISOString(), snoozedUntil: r.snoozedUntil?.toISOString() ?? null, createdAt: r.createdAt.toISOString() };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const updates: Record<string, unknown> = { ...body };
  if (body.scheduledAt) updates.scheduledAt = new Date(body.scheduledAt);
  const [reminder] = await db.update(remindersTable).set(updates).where(eq(remindersTable.id, parseInt(id))).returning();
  if (!reminder) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(serializeReminder(reminder));
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.delete(remindersTable).where(eq(remindersTable.id, parseInt(id)));
  return new NextResponse(null, { status: 204 });
}
