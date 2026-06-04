import { NextRequest, NextResponse } from "next/server";
import { db, habitsTable } from "@/lib/db";
import { eq } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const habits = await db.select().from(habitsTable).where(eq(habitsTable.userId, user.id));
  return NextResponse.json(habits);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const [habit] = await db.insert(habitsTable).values({
    userId: user.id,
    name: body.name,
    frequency: body.frequency || "daily",
    color: body.color || "primary",
  }).returning();

  return NextResponse.json(habit, { status: 201 });
}
