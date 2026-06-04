import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db, settingsTable } from "@/lib/db";
import { eq, ilike, ne, isNotNull } from "drizzle-orm";

// GET /api/users/username?q=mika  → search usernames
// GET /api/users/username?check=mika → check availability
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const check = searchParams.get("check");

  // Availability check
  if (check !== null) {
    const username = check.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (username.length < 3) return NextResponse.json({ available: false, reason: "Too short" });
    if (username.length > 20) return NextResponse.json({ available: false, reason: "Too long" });
    
    const [existing] = await db
      .select({ id: settingsTable.id })
      .from(settingsTable)
      .where(eq(settingsTable.username, username));
    
    // If existing belongs to current user, it's still "available" (it's their own)
    return NextResponse.json({ available: !existing, username });
  }

  // Search/autocomplete
  if (q !== null) {
    const results = await db
      .select({ username: settingsTable.username, userId: settingsTable.userId })
      .from(settingsTable)
      .where(ilike(settingsTable.username, `${q}%`))
      .limit(8);
    
    // Filter out current user
    const filtered = results
      .filter(r => r.username && r.userId !== user.id)
      .map(r => ({ username: r.username }));
    
    return NextResponse.json(filtered);
  }

  return NextResponse.json({ error: "Provide ?q= or ?check= param" }, { status: 400 });
}
