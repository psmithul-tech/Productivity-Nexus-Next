export type CultivatorRank =
  | "Mortal Awakening"
  | "Qi Gatherer"
  | "Qi Foundation"
  | "Spirit Disciple"
  | "Spirit Master"
  | "Profound Realm"
  | "Half Martial Artist"
  | "Martial Artist"
  | "Martial Lord"
  | "Half Martial King"
  | "Martial King"
  | "Martial Emperor"
  | "Half Martial Ancestor"
  | "Martial Ancestor"
  | "Half Martial Exalted"
  | "Martial Exalted"
  | "Half Martial Immortal"
  | "Martial Immortal";

export const CULTIVATOR_RANKS: CultivatorRank[] = [
  "Mortal Awakening",
  "Qi Gatherer",
  "Qi Foundation",
  "Spirit Disciple",
  "Spirit Master",
  "Profound Realm",
  "Half Martial Artist",
  "Martial Artist",
  "Martial Lord",
  "Half Martial King",
  "Martial King",
  "Martial Emperor",
  "Half Martial Ancestor",
  "Martial Ancestor",
  "Half Martial Exalted",
  "Martial Exalted",
  "Half Martial Immortal",
  "Martial Immortal",
];

export const RANK_DESCRIPTIONS: Record<CultivatorRank, string> = {
  "Mortal Awakening":       "Your spiritual veins have opened. The path begins.",
  "Qi Gatherer":            "You gather ambient Qi and cycle it through your meridians.",
  "Qi Foundation":          "Your Qi has formed a stable foundation in your dantian.",
  "Spirit Disciple":        "You have entered the Spirit World, touching true cultivation.",
  "Spirit Master":          "You command your spirit power with growing mastery.",
  "Profound Realm":         "Profound Force flows through you — far beyond ordinary mortals.",
  "Half Martial Artist":    "You stand at the threshold between mortal and true martial might.",
  "Martial Artist":         "A true Martial Artist. You could level a building with bare hands.",
  "Martial Lord":           "You command armies with your aura alone.",
  "Half Martial King":      "Your power makes the earth tremble when you move.",
  "Martial King":           "Kings and emperors bow before cultivators of your rank.",
  "Martial Emperor":        "Your mastery rewrites the laws of combat in every battle.",
  "Half Martial Ancestor":  "You have touched a realm few in history have reached.",
  "Martial Ancestor":       "Legends call your name. Heaven itself takes note.",
  "Half Martial Exalted":   "You are a transcendent being. Reality bends around your will.",
  "Martial Exalted":        "Your cultivation has surpassed the mortal realm entirely.",
  "Half Martial Immortal":  "The boundary of immortality shimmers before you.",
  "Martial Immortal":       "You have conquered death itself. The heavens weep in envy.",
};

export const RANK_COLORS: Record<CultivatorRank, string> = {
  "Mortal Awakening":       "#8898a8",
  "Qi Gatherer":            "#70b8d0",
  "Qi Foundation":          "#50d0c0",
  "Spirit Disciple":        "#60e080",
  "Spirit Master":          "#80f040",
  "Profound Realm":         "#c0e020",
  "Half Martial Artist":    "#f0c030",
  "Martial Artist":         "#f08020",
  "Martial Lord":           "#e05020",
  "Half Martial King":      "#d02010",
  "Martial King":           "#c00040",
  "Martial Emperor":        "#a000c0",
  "Half Martial Ancestor":  "#8000ff",
  "Martial Ancestor":       "#6020ff",
  "Half Martial Exalted":   "#4060ff",
  "Martial Exalted":        "#2090ff",
  "Half Martial Immortal":  "#20c0ff",
  "Martial Immortal":       "#f0f0ff",
};

// How much cultivator exp each rank requires to advance
export const RANK_EXP_THRESHOLDS: Record<CultivatorRank, number> = {
  "Mortal Awakening":       100,
  "Qi Gatherer":            150,
  "Qi Foundation":          250,
  "Spirit Disciple":        350,
  "Spirit Master":          500,
  "Profound Realm":         700,
  "Half Martial Artist":    950,
  "Martial Artist":         1200,
  "Martial Lord":           1500,
  "Half Martial King":      1900,
  "Martial King":           2400,
  "Martial Emperor":        3000,
  "Half Martial Ancestor":  3800,
  "Martial Ancestor":       4800,
  "Half Martial Exalted":   6000,
  "Martial Exalted":        7500,
  "Half Martial Immortal":  9500,
  "Martial Immortal":       Infinity,
};

export function getCultivatorRankIndex(rank: CultivatorRank): number {
  return CULTIVATOR_RANKS.indexOf(rank);
}

export function getNextRank(rank: CultivatorRank): CultivatorRank | null {
  const idx = getCultivatorRankIndex(rank);
  return idx < CULTIVATOR_RANKS.length - 1 ? CULTIVATOR_RANKS[idx + 1] : null;
}

export const RANK_ABILITIES: Partial<Record<CultivatorRank, string>> = {
  "Qi Gatherer": "Qi Sense (See flow of energy)",
  "Spirit Disciple": "Spirit Walk (Brief levitation)",
  "Profound Realm": "Profound Shield (Energy barrier)",
  "Martial Artist": "Shatter Strike (Break boulders barehanded)",
  "Martial King": "Aura of Dominion (Command lesser beings)",
  "Martial Emperor": "Heavenly Tribulation (Call lightning)",
  "Martial Exalted": "Void Step (Teleportation)",
  "Martial Immortal": "Eternal Body (Agelessness)",
};

export interface AdvanceResult {
  newRank: CultivatorRank;
  newExp: number;
  advanced: boolean;
  consequence?: "drop_rank" | "stat_loss" | "severe_injury" | "none";
  grantedAbility?: string;
}

export function tryAdvanceRank(
  currentRank: CultivatorRank,
  currentExp: number,
  magic: number,
  intelligence: number,
  strength: number,
): AdvanceResult {
  const threshold = RANK_EXP_THRESHOLDS[currentRank];
  if (currentExp < threshold) return { newRank: currentRank, newExp: currentExp, advanced: false, consequence: "none" };

  const nextRank = getNextRank(currentRank);
  if (!nextRank) return { newRank: currentRank, newExp: currentExp, advanced: false, consequence: "none" };

  // Breakthrough difficulty based on rank — higher ranks need stat requirements
  const rankIdx = getCultivatorRankIndex(currentRank);
  const statBonus = (magic + intelligence + strength) / 3;
  const isBottleneck = rankIdx >= 3; // Spirit Disciple and above are bottlenecks
  
  const baseChance = Math.min(0.95, 0.6 + (statBonus / 300) - rankIdx * 0.02);
  const breakthroughChance = isBottleneck ? baseChance - 0.15 : baseChance;

  if (Math.random() < breakthroughChance) {
    const grantedAbility = RANK_ABILITIES[nextRank];
    return { newRank: nextRank, newExp: 0, advanced: true, consequence: "none", grantedAbility };
  }
  
  // Failed breakthrough — check consequences for bottlenecks
  if (isBottleneck) {
    const failRoll = Math.random();
    let dropRank = false;
    let newRank = currentRank;
    
    if (failRoll < 0.25 && rankIdx > 0) {
      // Drop a rank
      newRank = CULTIVATOR_RANKS[rankIdx - 1];
      return { newRank, newExp: Math.floor(RANK_EXP_THRESHOLDS[newRank] * 0.8), advanced: false, consequence: "drop_rank" };
    } else if (failRoll < 0.55) {
      // Irreversible stat loss (handled by caller, but we flag it)
      return { newRank, newExp: Math.floor(threshold * 0.5), advanced: false, consequence: "stat_loss" };
    } else {
      // Severe injury
      return { newRank, newExp: Math.floor(threshold * 0.5), advanced: false, consequence: "severe_injury" };
    }
  }

  // Normal failure - keep exp near threshold
  return { newRank: currentRank, newExp: Math.floor(threshold * 0.9), advanced: false, consequence: "none" };
}
