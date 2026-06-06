import { NextRequest, NextResponse } from "next/server";
import { db, familyMembersTable, settingsTable } from "@/lib/db";
import { eq } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { username } = await req.json();
  if (!username) return NextResponse.json({ error: "Username is required" }, { status: 400 });

  // 1. Ensure caller is in a family
  const callerMemberships = await db.select().from(familyMembersTable).where(eq(familyMembersTable.userId, user.id));
  if (callerMemberships.length === 0) {
    return NextResponse.json({ error: "You are not in a family" }, { status: 400 });
  }
  
  const familyId = callerMemberships[0].familyId;
  const callerRole = callerMemberships[0].role;
  
  if (callerRole !== "admin") {
    return NextResponse.json({ error: "Only family admins can add members" }, { status: 403 });
  }

  // 2. Find user by username
  const targetUsers = await db.select().from(settingsTable).where(eq(settingsTable.username, username));
  if (targetUsers.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const targetUserId = targetUsers[0].userId;

  // 3. Check if target is already in a family
  const targetMemberships = await db.select().from(familyMembersTable).where(eq(familyMembersTable.userId, targetUserId));
  if (targetMemberships.length > 0) {
    return NextResponse.json({ error: "User is already in a family" }, { status: 400 });
  }

  // 4. Add target to family
  await db.insert(familyMembersTable).values({
    familyId,
    userId: targetUserId,
    role: "member",
  });

  return NextResponse.json({ success: true });
}
