import { NextResponse } from "next/server";
import { db, goalsTable, roadmapsTable } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const goals = await db.select()
      .from(goalsTable)
      .where(eq(goalsTable.userId, user.id));
      
    // Fetch roadmaps for each goal
    const roadmaps = await db.select().from(roadmapsTable);
    
    const formatted = goals.map(g => ({
      ...g,
      roadmaps: roadmaps.filter(r => r.goalId === g.id)
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
    const { title, description, deadline } = body;
    if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

    const [newGoal] = await db.insert(goalsTable).values({
      userId: user.id,
      title,
      description,
      deadline: deadline ? new Date(deadline) : null
    }).returning();

    return NextResponse.json(newGoal);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
