export type CosmicTier =
  | "Mortal"
  | "Kingdom"
  | "Empire"
  | "Continent"
  | "Planet"
  | "Galaxy"
  | "Universe";

export type FamilyRank =
  | "Peasant"
  | "Common"
  | "Noble"
  | "Lord"
  | "Royal"
  | "Imperial"
  | "Divine";

export interface CosmicTierDef {
  tier: CosmicTier;
  icon: string;
  color: string;
  minLegacy: number;
  desc: string;
  title: string;
}

export interface FamilyRankDef {
  rank: FamilyRank;
  icon: string;
  color: string;
  minLegacy: number;
  desc: string;
  wealthBonus: number;
}

export const COSMIC_TIERS: CosmicTierDef[] = [
  { tier: "Mortal",    icon: "🏘", color: "#9090a0", minLegacy: 0,      desc: "Known in your village",               title: "Common Soul"      },
  { tier: "Kingdom",   icon: "🏰", color: "#60a0d0", minLegacy: 1000,   desc: "Recognized across your kingdom",     title: "Kingdom Figure"   },
  { tier: "Empire",    icon: "⚔",  color: "#d0a040", minLegacy: 5000,   desc: "A name across empires",              title: "Imperial Legend"  },
  { tier: "Continent", icon: "🌍", color: "#60d080", minLegacy: 15000,  desc: "Continental power",                  title: "Continental Titan"},
  { tier: "Planet",    icon: "🌐", color: "#8060e0", minLegacy: 35000,  desc: "Planetary influence",                title: "Planetary Lord"   },
  { tier: "Galaxy",    icon: "🌌", color: "#e06080", minLegacy: 75000,  desc: "Galaxy-spanning legend",             title: "Galactic Sovereign"},
  { tier: "Universe",  icon: "✨", color: "#ffd700", minLegacy: 150000, desc: "A being of cosmic significance",     title: "Universal Deity"  },
];

export const FAMILY_RANKS: FamilyRankDef[] = [
  { rank: "Peasant",  icon: "🌾", color: "#9090a0", minLegacy: 0,     desc: "A humble beginning",             wealthBonus: 0   },
  { rank: "Common",   icon: "🏠", color: "#a08060", minLegacy: 500,   desc: "Modest standing",                wealthBonus: 2   },
  { rank: "Noble",    icon: "🏛", color: "#60a0d0", minLegacy: 2000,  desc: "Minor nobility with privilege",  wealthBonus: 8   },
  { rank: "Lord",     icon: "⚔",  color: "#d0a040", minLegacy: 5000,  desc: "Landed gentry and power",        wealthBonus: 15  },
  { rank: "Royal",    icon: "👑", color: "#e0b030", minLegacy: 15000, desc: "Blood of kings flows within",    wealthBonus: 25  },
  { rank: "Imperial", icon: "🔱", color: "#c060e0", minLegacy: 35000, desc: "Imperial lineage, feared by all",wealthBonus: 40  },
  { rank: "Divine",   icon: "✨", color: "#ffd700", minLegacy: 80000, desc: "Descended from the divine itself",wealthBonus: 60  },
];

export function getCosmicTier(legacyScore: number): CosmicTierDef {
  const tiers = [...COSMIC_TIERS].reverse();
  return tiers.find(t => legacyScore >= t.minLegacy) ?? COSMIC_TIERS[0];
}

export function getFamilyRank(legacyScore: number, propertiesCount: number): FamilyRankDef {
  const effectiveLegacy = legacyScore + propertiesCount * 200;
  const ranks = [...FAMILY_RANKS].reverse();
  return ranks.find(r => effectiveLegacy >= r.minLegacy) ?? FAMILY_RANKS[0];
}

export const DYNASTY_PREFIXES = [
  "House", "Clan", "Dynasty", "Order", "Circle", "Sect", "Guild",
  "Brotherhood", "Lineage", "Blood", "Covenant", "Legion",
];

export const IMPERIAL_TERRITORIES = [
  "the Northern Reaches", "the Iron Wastes", "the Sunken Lowlands",
  "the Eternal Peaks", "the Twilight Shores", "the Ashen Plains",
  "the Gilded Coast", "the Forbidden Crags", "the Starfall Basin",
  "the Shrouded Mire", "the Crystal Valleys", "the Ember Flats",
];

export function formatImperialTitle(familyRank: FamilyRank, bloodline: string): string {
  const titles: Record<FamilyRank, string[]> = {
    Peasant:  ["Peasant of", "Serf of", "Commoner of"],
    Common:   ["Citizen of", "Freeman of", "Tradesman of"],
    Noble:    ["Noble of", "Baron of", "Knight of"],
    Lord:     ["Lord of", "Count of", "Marquis of"],
    Royal:    ["Prince of", "King of", "Duke of"],
    Imperial: ["Emperor of", "Sovereign of", "Supreme Lord of"],
    Divine:   ["Deity of", "God-King of", "Eternal Ruler of"],
  };
  const list = titles[familyRank];
  return list[Math.floor(Math.random() * list.length)];
}
