import { NextResponse } from "next/server";
import { db, attendanceLogsTable, subjectsTable } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { eq, desc } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { subjectId, status } = body; // 'present' | 'absent' | 'cancelled'
    if (!subjectId || !status) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    // Validate ownership
    const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, subjectId));
    if (!subject || subject.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [log] = await db.insert(attendanceLogsTable).values({
      subjectId,
      status
    }).returning();

    return NextResponse.json(log);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const logs = await db.select({
      id: attendanceLogsTable.id,
      subjectId: attendanceLogsTable.subjectId,
      status: attendanceLogsTable.status,
      date: attendanceLogsTable.date,
      subjectName: subjectsTable.name,
      userId: subjectsTable.userId,
    }).from(attendanceLogsTable)
      .innerJoin(subjectsTable, eq(attendanceLogsTable.subjectId, subjectsTable.id))
      .where(eq(subjectsTable.userId, user.id))
      .orderBy(desc(attendanceLogsTable.date))
      .limit(10);

    return NextResponse.json(logs);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
