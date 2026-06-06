import { NextResponse } from "next/server";
import { db, subjectsTable, attendanceLogsTable } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { eq, sql } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const subjects = await db.select({
      id: subjectsTable.id,
      name: subjectsTable.name,
      targetPercentage: subjectsTable.targetPercentage,
      totalPresent: sql<number>`count(case when ${attendanceLogsTable.status} = 'present' then 1 end)::int`,
      totalClasses: sql<number>`count(case when ${attendanceLogsTable.status} in ('present', 'absent') then 1 end)::int`,
    })
    .from(subjectsTable)
    .leftJoin(attendanceLogsTable, eq(subjectsTable.id, attendanceLogsTable.subjectId))
    .where(eq(subjectsTable.userId, user.id))
    .groupBy(subjectsTable.id)
    .orderBy(subjectsTable.name);

    const formatted = subjects.map(s => ({
      ...s,
      percentage: s.totalClasses === 0 ? 100 : (s.totalPresent / s.totalClasses) * 100
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
    const { name, targetPercentage } = body;
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const [newSubject] = await db.insert(subjectsTable).values({
      userId: user.id,
      name,
      targetPercentage: targetPercentage || 75
    }).returning();

    return NextResponse.json(newSubject);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
