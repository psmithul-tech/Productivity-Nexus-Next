import { NextRequest, NextResponse } from "next/server";
import { db, remindersTable } from "@/lib/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

function serializeReminder(r: typeof remindersTable.$inferSelect) {
  return { ...r, scheduledAt: r.scheduledAt.toISOString(), snoozedUntil: r.snoozedUntil?.toISOString() ?? null, createdAt: r.createdAt.toISOString() };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const snoozeUntil = body.snoozeUntil ? new Date(body.snoozeUntil) : new Date(Date.now() + 30 * 60 * 1000);
  const [reminder] = await db.update(remindersTable).set({ status: "snoozed", snoozedUntil: snoozeUntil }).where(eq(remindersTable.id, parseInt(id))).returning();
  if (!reminder) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(serializeReminder(reminder));
}
