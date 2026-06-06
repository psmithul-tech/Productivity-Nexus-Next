import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db, mealLogsTable } from "@/lib/db";
import { eq, and, gte, lt, desc } from "drizzle-orm";
import { normalizeTimeZone, parseDateTimeInTimeZone } from "@/lib/timezone";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const dateStr = url.searchParams.get("date"); // YYYY-MM-DD
  const timezone = normalizeTimeZone(url.searchParams.get("timezone") || "UTC");

  try {
    let query = db.select().from(mealLogsTable).where(eq(mealLogsTable.userId, user.id)).orderBy(desc(mealLogsTable.loggedAt));

    if (dateStr) {
      // Filter by the specific local day
      const startOfDay = parseDateTimeInTimeZone(`${dateStr}T00:00:00`, timezone);
      const endOfDay = parseDateTimeInTimeZone(`${dateStr}T23:59:59`, timezone);
      query = db.select().from(mealLogsTable)
        .where(
          and(
            eq(mealLogsTable.userId, user.id),
            gte(mealLogsTable.loggedAt, startOfDay),
            lt(mealLogsTable.loggedAt, endOfDay)
          )
        ).orderBy(desc(mealLogsTable.loggedAt)) as any;
    }

    const logs = await query;
    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Fetch meal logs error:", error);
    return NextResponse.json({ error: "Failed to fetch meal logs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { mealType, foodItems, calories, protein, carbs, fat, imageUrl } = body;

    const [newLog] = await db.insert(mealLogsTable).values({
      userId: user.id,
      mealType,
      foodItems: JSON.stringify(foodItems || []),
      calories: calories || 0,
      protein: protein || 0,
      carbs: carbs || 0,
      fat: fat || 0,
      imageUrl: imageUrl || null,
    }).returning();

    return NextResponse.json({ log: newLog });
  } catch (error) {
    console.error("Save meal log error:", error);
    return NextResponse.json({ error: "Failed to save meal log" }, { status: 500 });
  }
}
