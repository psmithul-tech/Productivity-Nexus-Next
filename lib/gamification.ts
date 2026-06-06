import { db, settingsTable } from "@/lib/db";
import { eq, sql } from "drizzle-orm";

export const XP_AWARDS = {
  TASK_COMPLETED: 10,
  HABIT_COMPLETED: 15,
  ATTENDANCE_LOGGED: 5,
};

export async function awardXP(userId: string, amount: number) {
  try {
    // Current level threshold is level * 100
    // We increment XP and recalculate level on the fly
    await db.execute(
      sql`
        UPDATE settings
        SET 
          xp = xp + ${amount},
          level = FLOOR(SQRT((xp + ${amount}) / 100)) + 1
        WHERE user_id = ${userId}
      `
    );
  } catch (error) {
    console.error("Failed to award XP:", error);
  }
}
