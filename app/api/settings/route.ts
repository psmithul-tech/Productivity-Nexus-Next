import { NextRequest, NextResponse } from "next/server";
import { db, settingsTable } from "@/lib/db";
import { eq } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [settings] = await db.select().from(settingsTable).where(eq(settingsTable.userId, user.id));
  if (!settings) return NextResponse.json({ error: "No settings found" }, { status: 404 });
  return NextResponse.json({ ...settings, createdAt: settings.createdAt.toISOString() });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  
  // Sanitize body to remove restricted fields
  delete body.id;
  delete body.userId;
  delete body.createdAt;
  
  const [existing] = await db.select().from(settingsTable).where(eq(settingsTable.userId, user.id));
  if (existing) {
    const [updated] = await db.update(settingsTable).set(body).where(eq(settingsTable.userId, user.id)).returning();
    return NextResponse.json({ ...updated, createdAt: updated.createdAt.toISOString() });
  }
  const [created] = await db.insert(settingsTable).values({ ...body, userId: user.id }).returning();
  return NextResponse.json({ ...created, createdAt: created.createdAt.toISOString() }, { status: 201 });
}
