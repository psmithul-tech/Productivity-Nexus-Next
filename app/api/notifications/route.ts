import { NextRequest, NextResponse } from "next/server";
import { db, notificationsTable } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, user.id))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);

  return NextResponse.json(notifications.map(n => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
  })));
}

// Mark all as read
export async function PATCH() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db
    .update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.userId, user.id));

  return NextResponse.json({ success: true });
}
