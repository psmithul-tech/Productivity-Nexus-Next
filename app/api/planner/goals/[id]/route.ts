import { NextResponse } from "next/server";
import { db, goalsTable, roadmapsTable, milestonesTable } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const goalId = parseInt(id, 10);

    const [goal] = await db.select()
      .from(goalsTable)
      .where(and(eq(goalsTable.id, goalId), eq(goalsTable.userId, user.id)));
      
    if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const roadmaps = await db.select().from(roadmapsTable).where(eq(roadmapsTable.goalId, goalId));
    
    // For each roadmap, fetch milestones
    const fullRoadmaps = await Promise.all(roadmaps.map(async (r) => {
      const milestones = await db.select().from(milestonesTable).where(eq(milestonesTable.roadmapId, r.id));
      return { ...r, milestones };
    }));

    return NextResponse.json({ ...goal, roadmaps: fullRoadmaps });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const goalId = parseInt(id, 10);

    await db.delete(goalsTable).where(and(eq(goalsTable.id, goalId), eq(goalsTable.userId, user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
