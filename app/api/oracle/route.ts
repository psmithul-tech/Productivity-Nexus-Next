import { AGENTS } from "@/lib/agents";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db, settingsTable } from "@/lib/db";
import { eq } from "drizzle-orm";
import { GameState } from "@/lib/games/life-chronicle/engine/types";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const state: GameState = body.state;
    if (!state) return NextResponse.json({ error: "Missing game state" }, { status: 400 });

    const [settings] = await db.select().from(settingsTable).where(eq(settingsTable.userId, user.id));

    // Determine strengths and weaknesses
    const sortedStats = Object.entries(state.stats).sort(([, a], [, b]) => (b as number) - (a as number));
    const topStats = sortedStats.slice(0, 2).map(([k, v]) => `${k}:${v}`).join(", ");
    const weakStats = sortedStats.slice(-2).map(([k, v]) => `${k}:${v}`).join(", ");

    // Recent logs
    const recentLogs = state.eventLog.slice(-5).join(" | ");

    const systemPrompt = `You are the Chronicler of the ${state.realm} realm. You are observing a character named ${state.name} (${state.bloodline} bloodline).
Your job is to write a single, atmospheric 1-3 sentence summary of their life over the past year (they are now age ${state.age}).
Keep it evocative, dark fantasy tone, and specific to what they did recently. DO NOT output lists. Speak directly to the player using "you" and "your".`;

    const userPrompt = `
Character: ${state.name}, Age ${state.age}, Realm: ${state.realm}.
Strengths: ${topStats}. Weaknesses: ${weakStats}.
Recent actions this year: ${recentLogs}.
Job: ${state.activeJob || "None"}. Path: ${state.mysticalPath !== "none" ? state.mysticalPath : "Mortal"}.
Write a short chronicle entry for this year. Make it sound like an ancient, personalized text detailing their life.`;

    let responseText = "";
    try {
      const { callOpenRouter } = await import("@/lib/openrouter");
      responseText = await callOpenRouter(userPrompt, systemPrompt, {
        model: AGENTS.CHIEF_OF_STAFF,
        temperature: 0.7,
      });
    } catch (orError) {
      console.error("OpenRouter Chronicle Error:", orError);
    }

    if (!responseText) {
      responseText = "The pages of your chronicle remain mysteriously blank for this year.";
    }

    return NextResponse.json({ text: responseText.trim() });
  } catch (error) {
    console.error("Oracle Chronicle Error:", error);
    return NextResponse.json({ text: "A quiet year passed... the Chronicler's pen ran dry." }, { status: 500 });
  }
}
