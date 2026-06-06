import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db, mealLogsTable } from "@/lib/db";
import { eq, and, gte, asc } from "drizzle-orm";
import { subDays, format } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const days = parseInt(url.searchParams.get("days") || "7", 10);
  
  try {
    // Determine the start date
    const today = new Date();
    const startDate = subDays(today, days - 1);
    startDate.setHours(0, 0, 0, 0);

    const logs = await db.select().from(mealLogsTable)
      .where(
        and(
          eq(mealLogsTable.userId, user.id),
          gte(mealLogsTable.loggedAt, startDate)
        )
      ).orderBy(asc(mealLogsTable.loggedAt));

    // Group by date string YYYY-MM-DD
    const grouped: Record<string, any> = {};
    
    // Initialize last N days with 0 to ensure the chart has continuous dates
    for (let i = days - 1; i >= 0; i--) {
      const d = subDays(today, i);
      const dateStr = format(d, "yyyy-MM-dd");
      grouped[dateStr] = {
        date: dateStr,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      };
    }

    logs.forEach(log => {
      const dateStr = format(new Date(log.loggedAt), "yyyy-MM-dd");
      if (grouped[dateStr]) {
        grouped[dateStr].calories += log.calories;
        grouped[dateStr].protein += log.protein;
        grouped[dateStr].carbs += log.carbs;
        grouped[dateStr].fat += log.fat;
      }
    });

    const history = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Fetch meal history error:", error);
    return NextResponse.json({ error: "Failed to fetch meal history" }, { status: 500 });
  }
}
