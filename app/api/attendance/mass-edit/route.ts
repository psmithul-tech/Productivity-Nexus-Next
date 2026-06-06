import { NextResponse } from "next/server";
import { db, attendanceLogsTable, subjectsTable } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { subjectId, presentCount, absentCount } = body;
    
    if (!subjectId || presentCount === undefined || absentCount === undefined) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Validate ownership
    const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, subjectId));
    if (!subject || subject.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const logsToInsert = [];
    
    for (let i = 0; i < presentCount; i++) {
      logsToInsert.push({ subjectId, status: "present" });
    }
    
    for (let i = 0; i < absentCount; i++) {
      logsToInsert.push({ subjectId, status: "absent" });
    }

    if (logsToInsert.length > 0) {
      await db.insert(attendanceLogsTable).values(logsToInsert);
    }

    return NextResponse.json({ success: true, count: logsToInsert.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
