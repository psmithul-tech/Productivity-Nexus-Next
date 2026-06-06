import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db, dietGoalsTable } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [goals] = await db.select().from(dietGoalsTable).where(eq(dietGoalsTable.userId, user.id));
    if (!goals) {
      return NextResponse.json({ goals: { targetCalories: 2000, targetProtein: 150, targetCarbs: 200, targetFat: 65 } });
    }
    return NextResponse.json({ goals });
  } catch (error) {
    console.error("Fetch diet goals error:", error);
    return NextResponse.json({ error: "Failed to fetch diet goals" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { targetCalories, targetProtein, targetCarbs, targetFat } = body;

    const [existing] = await db.select().from(dietGoalsTable).where(eq(dietGoalsTable.userId, user.id));

    if (existing) {
      const [updated] = await db.update(dietGoalsTable).set({
        targetCalories, targetProtein, targetCarbs, targetFat, updatedAt: new Date()
      }).where(eq(dietGoalsTable.userId, user.id)).returning();
      return NextResponse.json({ goals: updated });
    } else {
      const [inserted] = await db.insert(dietGoalsTable).values({
        userId: user.id,
        targetCalories, targetProtein, targetCarbs, targetFat
      }).returning();
      return NextResponse.json({ goals: inserted });
    }
  } catch (error) {
    console.error("Save diet goals error:", error);
    return NextResponse.json({ error: "Failed to save diet goals" }, { status: 500 });
  }
}
