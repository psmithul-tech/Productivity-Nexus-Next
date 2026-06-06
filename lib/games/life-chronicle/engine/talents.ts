export type Talent = "Genius" | "Talented" | "Average" | "Slow" | "Dull";

export interface TalentDef {
  label: Talent;
  icon: string;
  color: string;
  desc: string;
  actionBonus: number;
  statMult: number;
  successBonus: number;
}

export const TALENTS: Record<Talent, TalentDef> = {
  Genius: {
    label: "Genius",
    icon: "🧠",
    color: "#f0d060",
    desc: "Born exceptional. Everything comes easier — almost unfairly so.",
    actionBonus: 2,
    statMult: 1.3,
    successBonus: 0.2,
  },
  Talented: {
    label: "Talented",
    icon: "✦",
    color: "#80c0ff",
    desc: "Above average in most things. Hard work multiplies your gifts.",
    actionBonus: 1,
    statMult: 1.15,
    successBonus: 0.1,
  },
  Average: {
    label: "Average",
    icon: "◦",
    color: "#9090a0",
    desc: "A normal life. Neither cursed nor blessed — pure hard work shapes your fate.",
    actionBonus: 0,
    statMult: 1.0,
    successBonus: 0,
  },
  Slow: {
    label: "Slow",
    icon: "🐢",
    color: "#e0a040",
    desc: "Things don't come naturally. It takes twice the effort for half the result.",
    actionBonus: 0,
    statMult: 0.85,
    successBonus: -0.1,
  },
  Dull: {
    label: "Dull",
    icon: "💀",
    color: "#e05050",
    desc: "The world is against you from the start. Every victory is a miracle. The ultimate challenge.",
    actionBonus: -1,
    statMult: 0.7,
    successBonus: -0.2,
  },
};

export const TALENT_LIST: Talent[] = ["Genius", "Talented", "Average", "Slow", "Dull"];

export function applyTalentToEffects(
  effects: Record<string, number>,
  talent: Talent
): Record<string, number> {
  const mult = TALENTS[talent].statMult;
  const result: Record<string, number> = {};
  for (const [k, v] of Object.entries(effects)) {
    if (v > 0) {
      result[k] = Math.round(v * mult);
    } else {
      result[k] = v;
    }
  }
  return result;
}
