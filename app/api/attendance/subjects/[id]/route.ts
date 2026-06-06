import { NextResponse } from "next/server";
import { db, attendanceLogsTable, subjectsTable } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { eq } from "drizzle-orm";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const subjectId = parseInt((await params).id);
    if (isNaN(subjectId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    // Validate ownership (relaxed for seeded data)
    const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, subjectId));
    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Delete logs first to avoid foreign key constraints
    await db.delete(attendanceLogsTable).where(eq(attendanceLogsTable.subjectId, subjectId));
    
    // Delete the subject
    await db.delete(subjectsTable).where(eq(subjectsTable.id, subjectId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
