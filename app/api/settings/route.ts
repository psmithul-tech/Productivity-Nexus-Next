import { NextRequest, NextResponse } from "next/server";
import { db, settingsTable } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [settings] = await db.select().from(settingsTable);
  if (!settings) return NextResponse.json({ error: "No settings found" }, { status: 404 });
  return NextResponse.json({ ...settings, createdAt: settings.createdAt.toISOString() });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const [existing] = await db.select().from(settingsTable);
  if (existing) {
    const [updated] = await db.update(settingsTable).set(body).returning();
    return NextResponse.json({ ...updated, createdAt: updated.createdAt.toISOString() });
  }
  const [created] = await db.insert(settingsTable).values(body).returning();
  return NextResponse.json({ ...created, createdAt: created.createdAt.toISOString() }, { status: 201 });
}
