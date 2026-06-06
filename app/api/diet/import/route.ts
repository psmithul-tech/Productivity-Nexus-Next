import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db, dietGoalsTable } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await req.json();

    if (!payload || !payload.goals) {
      return NextResponse.json({ error: "Invalid payload: missing goals" }, { status: 400 });
    }

    const { targetCalories, targetProtein, targetCarbs, targetFat } = payload.goals;

    // Validate goals
    if (typeof targetCalories !== 'number' || typeof targetProtein !== 'number' || typeof targetCarbs !== 'number' || typeof targetFat !== 'number') {
        return NextResponse.json({ error: "Invalid goals format" }, { status: 400 });
    }

    // Upsert the goals
    const [existingGoal] = await db.select().from(dietGoalsTable).where(eq(dietGoalsTable.userId, user.id));

    if (existingGoal) {
      await db.update(dietGoalsTable)
        .set({ targetCalories, targetProtein, targetCarbs, targetFat })
        .where(eq(dietGoalsTable.id, existingGoal.id));
    } else {
      await db.insert(dietGoalsTable).values({
        userId: user.id,
        targetCalories,
        targetProtein,
        targetCarbs,
        targetFat
      });
    }

    // Return the plan if it exists
    return NextResponse.json({ 
        success: true, 
        message: "Goals updated successfully",
        plan: payload.plan || null
    });
  } catch (error) {
    console.error("Error importing diet data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
