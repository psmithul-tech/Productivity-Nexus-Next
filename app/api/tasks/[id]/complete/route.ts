import { NextRequest, NextResponse } from "next/server";
import { db, tasksTable, settingsTable } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

function serializeTask(t: typeof tasksTable.$inferSelect) {
  return {
    ...t,
    dueDate: t.dueDate?.toISOString() ?? null,
    completedAt: t.completedAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    recurrenceEndDate: t.recurrenceEndDate?.toISOString() ?? null,
  };
}

function getNextDueDate(currentDue: Date, recurrence: string): Date {
  const next = new Date(currentDue);
  switch (recurrence) {
    case "daily": next.setDate(next.getDate() + 1); break;
    case "weekdays":
      next.setDate(next.getDate() + 1);
      while (next.getDay() === 0 || next.getDay() === 6) next.setDate(next.getDate() + 1);
      break;
    case "weekly": next.setDate(next.getDate() + 7); break;
    case "monthly": next.setMonth(next.getMonth() + 1); break;
    default: next.setDate(next.getDate() + 1);
  }
  return next;
}

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const [settings] = await db.select().from(settingsTable).where(eq(settingsTable.userId, user.id));
  const username = settings?.username;

  const { id } = await params;
  
  const [taskToUpdate] = await db.select().from(tasksTable).where(eq(tasksTable.id, parseInt(id)));
  if (!taskToUpdate) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = taskToUpdate.userId === user.id;
  const isShared = taskToUpdate.sharedWith?.includes("*");
  const isAssigned = username && taskToUpdate.assignedTo === username;

  if (!isOwner && !isShared && !isAssigned) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [task] = await db.update(tasksTable)
    .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
    .where(eq(tasksTable.id, parseInt(id)))
    .returning();

  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Gamification: Award XP
  const { awardXP, XP_AWARDS } = await import("@/lib/gamification");
  await awardXP(user.id, XP_AWARDS.TASK_COMPLETED);

  // If recurring, auto-create next occurrence
  if (task.recurrence) {
    const baseDue = task.dueDate || new Date();
    const nextDue = getNextDueDate(baseDue, task.recurrence);

    // Only create if within recurrence end date (or no end date)
    if (!task.recurrenceEndDate || nextDue <= task.recurrenceEndDate) {
      await db.insert(tasksTable).values({
        userId: task.userId,
        title: task.title,
        description: task.description,
        priority: task.priority,
        bucket: task.bucket,
        category: task.category,
        dueDate: nextDue,
        estimatedMinutes: task.estimatedMinutes,
        reminderChannel: task.reminderChannel,
        recurrence: task.recurrence,
        recurrenceEndDate: task.recurrenceEndDate,
        parentTaskId: task.parentTaskId,
      });
    }
  }

  return NextResponse.json(serializeTask(task));
}
