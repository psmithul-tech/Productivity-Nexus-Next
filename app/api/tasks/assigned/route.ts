import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db, tasksTable, settingsTable } from "@/lib/db";
import { eq, and, ne } from "drizzle-orm";

// GET /api/tasks/assigned
// Returns tasks assigned TO the current user by OTHER users
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get current user's username
  const [settings] = await db
    .select({ username: settingsTable.username })
    .from(settingsTable)
    .where(eq(settingsTable.userId, user.id));

  if (!settings?.username) {
    return NextResponse.json([]); // No username set yet
  }

  const username = settings.username;

  // Fetch tasks assigned to this username that belong to OTHER users
  const assignedTasks = await db
    .select()
    .from(tasksTable)
    .where(
      and(
        eq(tasksTable.assignedTo, username),
        ne(tasksTable.userId, user.id) // from others
      )
    );

  // Also enrich with assigner's username
  const ownerIds = [...new Set(assignedTasks.map(t => t.userId))];
  let ownerUsernames: Record<string, string> = {};

  if (ownerIds.length > 0) {
    const owners = await db
      .select({ userId: settingsTable.userId, username: settingsTable.username })
      .from(settingsTable)
      .where(eq(settingsTable.userId, ownerIds[0])); // simple fetch
    // for multiple owners, iterate
    for (const oid of ownerIds) {
      const [o] = await db
        .select({ userId: settingsTable.userId, username: settingsTable.username })
        .from(settingsTable)
        .where(eq(settingsTable.userId, oid));
      if (o?.username) ownerUsernames[oid] = o.username;
    }
  }

  const enriched = assignedTasks.map(t => ({
    ...t,
    assignedByUsername: ownerUsernames[t.userId] ?? "unknown",
  }));

  return NextResponse.json(enriched);
}
