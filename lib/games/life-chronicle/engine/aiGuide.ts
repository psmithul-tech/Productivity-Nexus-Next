import { GameState } from "./types";

export type GuideMode = "advice" | "lore" | "prophecy" | "critique" | "event";

function buildSystemPrompt(): string {
  return `You are the Oracle — an ancient, all-knowing mystical guide in a dark fantasy life simulator game called CHRONICLE. 
You speak with gravitas, wisdom, and a touch of ominous flair. 
Your role is to advise the player about their character's life, offer lore, make prophecies, and narrate the world.
Keep responses SHORT and PUNCHY — 2-4 sentences max. Be vivid and immersive. Use fantasy language but keep it readable.
Avoid lists. Speak directly to the player using "you" and "your character."`;
}

function buildPrompt(state: GameState, mode: GuideMode, extraContext?: string): string {
  const top3Stats = Object.entries(state.stats)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([k, v]) => `${k}:${v}`)
    .join(", ");

  const bottom3Stats = Object.entries(state.stats)
    .sort(([, a], [, b]) => (a as number) - (b as number))
    .slice(0, 3)
    .map(([k, v]) => `${k}:${v}`)
    .join(", ");

  const recentEvents = state.eventLog.slice(-3).join(" | ");

  const base = `Character: ${state.name}, ${state.bloodline} bloodline, Age ${state.age}, Realm: ${state.realm}.
Strengths: ${top3Stats}. Weaknesses: ${bottom3Stats}.
Recent life events: ${recentEvents}.
Legacy score: ${state.legacyScore}. Properties owned: ${state.properties.length}. Achievements: ${state.achievements.join(", ") || "none yet"}.`;

  if (mode === "advice") {
    return `${base}\n\nAs the Oracle, give this character brief, specific strategic advice on how to improve their life given their current stats, bloodline, and realm. What should they focus on?`;
  }
  if (mode === "lore") {
    return `${base}\n\nAs the Oracle, share a piece of compelling lore or secret history about the ${state.realm} realm and how it relates to the ${state.bloodline} bloodline. Make it feel ancient and mysterious.`;
  }
  if (mode === "prophecy") {
    return `${base}\n\nAs the Oracle, deliver a dark or hopeful prophecy about this character's future based on their current path. Be cryptic but hintful.`;
  }
  if (mode === "critique") {
    return `${base}\n\nAs the Oracle, bluntly (but with wit) critique the biggest mistake or weakness in this character's life so far. Be harsh but fair.`;
  }
  if (mode === "event" && extraContext) {
    return `${base}\n\nA life event is happening: "${extraContext}"\n\nAs the Oracle, give dramatic commentary on this moment and a hint about which choice might serve this character best. Stay mysterious — don't be too direct.`;
  }
  return base;
}

export async function askOracle(
  state: GameState,
  mode: GuideMode,
  extraContext?: string
): Promise<string> {
  try {
    const res = await fetch("/api/oracle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemPrompt: buildSystemPrompt(),
        userPrompt: buildPrompt(state, mode, extraContext),
      }),
    });

    if (!res.ok) {
      if (res.status === 503) {
        return "The Oracle sleeps… (AI not configured)";
      }
      return "The Oracle's vision is clouded… try again shortly.";
    }

    const data = await res.json();
    return data.text || "The Oracle speaks in silence…";
  } catch (e) {
    console.error("Oracle error:", e);
    return "The Oracle's connection to the divine has faltered…";
  }
}
