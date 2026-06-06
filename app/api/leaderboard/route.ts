import { NextRequest, NextResponse } from "next/server";
import { db, settingsTable, familyMembersTable } from "@/lib/db";
import { desc, eq, inArray } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "global"; // "global" | "family"

  if (type === "family") {
    // 1. Find user's family
    const members = await db.select().from(familyMembersTable).where(eq(familyMembersTable.userId, user.id));
    if (members.length === 0) {
      return NextResponse.json([]); // No family, no leaderboard
    }
    const familyId = members[0].familyId;

    // 2. Fetch all members in this family
    const familyUsers = await db.select().from(familyMembersTable).where(eq(familyMembersTable.familyId, familyId));
    const userIds = familyUsers.map(m => m.userId);

    const leaderboard = await db
      .select({
        id: settingsTable.id,
        userId: settingsTable.userId,
        username: settingsTable.username,
        xp: settingsTable.xp,
        level: settingsTable.level,
        accentColor: settingsTable.accentColor,
      })
      .from(settingsTable)
      .where(inArray(settingsTable.userId, userIds))
      .orderBy(desc(settingsTable.xp));

    const userMap = new Map();
    familyUsers.forEach(m => {
      userMap.set(m.userId, {
        id: `temp-${m.userId}`,
        userId: m.userId,
        username: "Unknown",
        xp: 0,
        level: 1,
        accentColor: "default",
      });
    });

    leaderboard.forEach(l => {
      userMap.set(l.userId, l);
    });

    const finalLeaderboard = Array.from(userMap.values()).sort((a, b) => b.xp - a.xp);

    return NextResponse.json(finalLeaderboard);
  } else {
    // Global Leaderboard (Masked Usernames)
    const leaderboard = await db
      .select({
        id: settingsTable.id,
        userId: settingsTable.userId,
        username: settingsTable.username,
        xp: settingsTable.xp,
        level: settingsTable.level,
        accentColor: settingsTable.accentColor,
      })
      .from(settingsTable)
      .orderBy(desc(settingsTable.xp))
      .limit(100);

    const maskedLeaderboard = leaderboard.map(entry => {
      let maskedUsername = entry.username || "Unknown";
      if (entry.userId !== user.id && maskedUsername.length > 2) {
        maskedUsername = maskedUsername.substring(0, 2) + "***";
      } else if (entry.userId !== user.id && maskedUsername.length > 0) {
        maskedUsername = maskedUsername.substring(0, 1) + "***";
      }
      
      return {
        ...entry,
        username: maskedUsername,
      };
    });

    return NextResponse.json(maskedLeaderboard);
  }
}
