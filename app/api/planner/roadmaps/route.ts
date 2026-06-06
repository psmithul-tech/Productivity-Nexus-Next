import { NextResponse } from "next/server";
import { db, roadmapsTable, milestonesTable, goalsTable } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Ensure we only get roadmaps for user's goals
    const goals = await db.select({ id: goalsTable.id }).from(goalsTable).where(eq(goalsTable.userId, user.id));
    const goalIds = goals.map(g => g.id);

    if (goalIds.length === 0) return NextResponse.json([]);

    const roadmaps = await db.select().from(roadmapsTable);
    const userRoadmaps = roadmaps.filter(r => goalIds.includes(r.goalId));

    const milestones = await db.select().from(milestonesTable);

    const formatted = userRoadmaps.map(r => ({
      ...r,
      milestones: milestones.filter(m => m.roadmapId === r.id)
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { goalId, title, description } = body;
    
    // Verify goal ownership
    const [goal] = await db.select().from(goalsTable).where(eq(goalsTable.id, goalId));
    if (!goal || goal.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const [newRoadmap] = await db.insert(roadmapsTable).values({
      goalId,
      title,
      description
    }).returning();

    return NextResponse.json(newRoadmap);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
