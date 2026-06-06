import { NextResponse } from "next/server";
import { db, goalsTable, roadmapsTable, milestonesTable, tasksTable, eventsTable } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await req.json();

    if (!payload.goal || !payload.goal.title) {
      return NextResponse.json({ error: "Missing goal title" }, { status: 400 });
    }

    // Process everything sequentially to ensure relations
    const [newGoal] = await db.insert(goalsTable).values({
      userId: user.id,
      title: payload.goal.title,
      description: payload.goal.description || "",
      deadline: payload.goal.deadline ? new Date(payload.goal.deadline) : null,
      status: "active"
    }).returning();

    if (payload.roadmaps && Array.isArray(payload.roadmaps)) {
      for (const rm of payload.roadmaps) {
        if (!rm.title) continue;
        const [newRoadmap] = await db.insert(roadmapsTable).values({
          goalId: newGoal.id,
          title: rm.title,
          description: rm.description || ""
        }).returning();

        if (rm.milestones && Array.isArray(rm.milestones)) {
          const milestonesToInsert = rm.milestones
            .filter((m: any) => m.title)
            .map((m: any) => ({
              roadmapId: newRoadmap.id,
              title: m.title,
              dueDate: m.dueDate ? new Date(m.dueDate) : null,
              status: "pending"
            }));
          if (milestonesToInsert.length > 0) {
            await db.insert(milestonesTable).values(milestonesToInsert);
          }
        }
      }
    }

    if (payload.tasks && Array.isArray(payload.tasks)) {
      const tasksToInsert = payload.tasks
        .filter((t: any) => t.title)
        .map((t: any) => ({
          userId: user.id,
          title: t.title,
          description: t.description || "",
          dueDate: t.dueDate ? new Date(t.dueDate) : null,
          priority: t.priority || "medium",
          bucket: t.bucket || "inbox",
          status: "active"
        }));
      if (tasksToInsert.length > 0) {
        await db.insert(tasksTable).values(tasksToInsert);
      }
    }

    if (payload.events && Array.isArray(payload.events)) {
      const eventsToInsert = payload.events
        .filter((e: any) => e.title && e.startTime && e.endTime)
        .map((e: any) => ({
          userId: user.id,
          title: e.title,
          description: e.description || "",
          startTime: new Date(e.startTime),
          endTime: new Date(e.endTime),
          source: "planner"
        }));
      if (eventsToInsert.length > 0) {
        await db.insert(eventsTable).values(eventsToInsert);
      }
    }

    return NextResponse.json({ success: true, goalId: newGoal.id });
  } catch (error) {
    console.error("AI Planner Import Error:", error);
    return NextResponse.json({ error: "Failed to parse and import plan" }, { status: 500 });
  }
}
