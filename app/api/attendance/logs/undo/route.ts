import { NextResponse } from "next/server";
import { db, attendanceLogsTable, subjectsTable } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { eq, and, desc } from "drizzle-orm";

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { subjectId } = body;
    if (!subjectId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    // Validate ownership (relaxed for seeded data)
    const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, subjectId));
    if (!subject || (subject.userId !== user.id && subject.userId !== "00000000-0000-0000-0000-000000000000")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find the latest log for this subject
    const latestLogs = await db.select()
      .from(attendanceLogsTable)
      .where(eq(attendanceLogsTable.subjectId, subjectId))
      .orderBy(desc(attendanceLogsTable.id))
      .limit(1);

    if (latestLogs.length === 0) {
      return NextResponse.json({ error: "No logs to undo" }, { status: 404 });
    }

    const logToUndo = latestLogs[0];

    // Delete it
    await db.delete(attendanceLogsTable).where(eq(attendanceLogsTable.id, logToUndo.id));

    return NextResponse.json({ success: true, undoneId: logToUndo.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
