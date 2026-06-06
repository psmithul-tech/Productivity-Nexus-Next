import { NextResponse } from "next/server";
import { db, attendanceLogsTable, subjectsTable } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { eq } from "drizzle-orm";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const subjectId = parseInt((await params).id);
    if (isNaN(subjectId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    // Validate ownership
    const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, subjectId));
    if (!subject || (subject.userId !== user.id && subject.userId !== "00000000-0000-0000-0000-000000000000")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let presents = 0;
    let absents = 0;
    try {
      const body = await req.json();
      presents = body.presents || 0;
      absents = body.absents || 0;
    } catch (e) {
      // Ignore JSON error if body is empty
    }

    // Delete all logs for this subject to reset attendance to 0/0
    await db.delete(attendanceLogsTable).where(eq(attendanceLogsTable.subjectId, subjectId));
    
    // Insert new exact logs if needed
    const newLogs = [];
    for (let i = 0; i < presents; i++) newLogs.push({ subjectId: subjectId, status: "present" as const });
    for (let i = 0; i < absents; i++) newLogs.push({ subjectId: subjectId, status: "absent" as const });
    
    if (newLogs.length > 0) {
      await db.insert(attendanceLogsTable).values(newLogs);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
