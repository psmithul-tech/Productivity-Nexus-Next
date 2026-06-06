"use server";

import { db } from "@/lib/db";
import { achievementsTable, leaderboardTable } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function submitScore(data: {
  playerId: string;
  playerName: string;
  characterName: string;
  realm: string;
  bloodline: string;
  legacyScore: number;
  lifespan: number;
  cause: string;
}) {
  await db.insert(leaderboardTable).values(data);
  return { success: true };
}

export async function listAchievements(playerId: string) {
  const achievements = await db
    .select()
    .from(achievementsTable)
    .where(eq(achievementsTable.playerId, playerId))
    .orderBy(desc(achievementsTable.unlockedAt));
  
  return achievements;
}
