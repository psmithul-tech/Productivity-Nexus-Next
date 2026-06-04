import { NextRequest, NextResponse } from "next/server";
import { db, tasksTable, settingsTable } from "@/lib/db";
import { eq, or, arrayContains, and, isNotNull } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get current user's username
  const [settings] = await db
    .select({ username: settingsTable.username })
    .from(settingsTable)
    .where(eq(settingsTable.userId, user.id));

  const myUsername = settings?.username ?? null;

  // Shared tasks = tasks owned by current user that are shared (have sharedWith or are assigned)
  // OR tasks from other users where the assignedTo is current user's username
  let sharedTasks = await db
    .select()
    .from(tasksTable)
    .where(
      or(
        // Tasks I created that are marked as shared
        and(eq(tasksTable.userId, user.id), arrayContains(tasksTable.sharedWith, ["*"])),
        // Tasks assigned to me by my username
        ...(myUsername ? [eq(tasksTable.assignedTo, myUsername)] : []),
      )
    );

  const combined = [...sharedTasks];

  // Enrich with owner usernames
  const ownerIds = [...new Set(combined.map(t => t.userId))];
  const ownerMap: Record<string, string> = {};

  for (const oid of ownerIds) {
    const [o] = await db
      .select({ username: settingsTable.username })
      .from(settingsTable)
      .where(eq(settingsTable.userId, oid));
    if (o?.username) ownerMap[oid] = o.username;
  }

  const enriched = combined.map(t => ({
    ...t,
    createdByUsername: ownerMap[t.userId] ?? null,
    isMyTask: t.userId === user.id,
  }));

  return NextResponse.json(enriched);
}
