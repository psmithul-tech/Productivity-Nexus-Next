import { NextRequest, NextResponse } from "next/server";
import { db, familiesTable, familyMembersTable, settingsTable } from "@/lib/db";
import { eq } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Find user's family
  const members = await db.select().from(familyMembersTable).where(eq(familyMembersTable.userId, user.id));
  
  if (members.length === 0) {
    return NextResponse.json({ family: null });
  }

  const familyId = members[0].familyId;
  const [family] = await db.select().from(familiesTable).where(eq(familiesTable.id, familyId));

  // Get all members with their basic info
  const allMembers = await db
    .select({
      id: familyMembersTable.id,
      userId: familyMembersTable.userId,
      role: familyMembersTable.role,
      username: settingsTable.username,
      xp: settingsTable.xp,
      level: settingsTable.level,
      accentColor: settingsTable.accentColor,
    })
    .from(familyMembersTable)
    .innerJoin(settingsTable, eq(settingsTable.userId, familyMembersTable.userId))
    .where(eq(familyMembersTable.familyId, familyId));

  return NextResponse.json({
    family,
    members: allMembers,
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  // Check if user already in a family
  const members = await db.select().from(familyMembersTable).where(eq(familyMembersTable.userId, user.id));
  if (members.length > 0) {
    return NextResponse.json({ error: "You are already in a family" }, { status: 400 });
  }

  // Create family
  const [family] = await db.insert(familiesTable).values({
    name,
    creatorId: user.id,
  }).returning();

  // Add creator as member
  await db.insert(familyMembersTable).values({
    familyId: family.id,
    userId: user.id,
    role: "admin",
  });

  return NextResponse.json(family, { status: 201 });
}
