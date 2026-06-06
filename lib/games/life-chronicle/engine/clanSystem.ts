import type { StatKey } from "./types";

export type ClanTier = "Wanderer" | "Minor" | "Major" | "Grand" | "Royal" | "Imperial" | "Legendary";

export interface ClanDef {
  name: string;
  tier: ClanTier;
  icon: string;
  color: string;
  desc: string;
  realmAffinity?: string;
  bloodlineAffinity?: string[];
  statBonus: Partial<Record<StatKey, number>>;
  wealthBonus: number;
  startingReputation: number;
  power: number;
}

export const CLAN_TIERS: Record<ClanTier, { label: string; color: string; rank: number; desc: string }> = {
  Wanderer:  { label: "Wanderer",  color: "#8898a8", rank: 0, desc: "No clan affiliation. Born free." },
  Minor:     { label: "Minor Clan",color: "#88b870", rank: 1, desc: "A small but known family name." },
  Major:     { label: "Major Clan",color: "#60c8e0", rank: 2, desc: "A respected regional power." },
  Grand:     { label: "Grand Clan",color: "#c080f0", rank: 3, desc: "A famous multi-realm bloodline." },
  Royal:     { label: "Royal Clan",color: "#f0c840", rank: 4, desc: "Royalty and ancient lineage." },
  Imperial:  { label: "Imperial",  color: "#f08030", rank: 5, desc: "Rulers of empires and domains." },
  Legendary: { label: "Legendary", color: "#ff4060", rank: 6, desc: "Myths made flesh. Feared by all." },
};

export const CLANS: ClanDef[] = [
  // ── WANDERER ──────────────────────────────────────────────────────────
  {
    name: "None",
    tier: "Wanderer",
    icon: "◦",
    color: "#8898a8",
    desc: "No clan. The world is your inheritance.",
    statBonus: { luck: 5 },
    wealthBonus: 0,
    startingReputation: 0,
    power: 0,
  },

  // ── MINOR CLANS ───────────────────────────────────────────────────────
  {
    name: "Clan Ashborn",
    tier: "Minor",
    icon: "🔥",
    color: "#e07050",
    desc: "Forged in the ashes of a fallen village. Survivors who clawed their way back.",
    bloodlineAffinity: ["Infernal", "Orcish"],
    realmAffinity: "Infernus",
    statBonus: { strength: 8, health: 5 },
    wealthBonus: 2,
    startingReputation: 10,
    power: 85,
  },
  {
    name: "House Mirefall",
    tier: "Minor",
    icon: "🌿",
    color: "#70b860",
    desc: "A modest farming family turned minor nobility through sheer stubbornness.",
    bloodlineAffinity: ["Common", "Merfolk"],
    statBonus: { happiness: 8, relationships: 5 },
    wealthBonus: 5,
    startingReputation: 8,
    power: 60,
  },
  {
    name: "Order of the Grey Path",
    tier: "Minor",
    icon: "⚔",
    color: "#a8b8c8",
    desc: "A small mercenary order with a strict code of honor.",
    statBonus: { strength: 5, reputation: 8, career: 5 },
    wealthBonus: 3,
    startingReputation: 12,
    power: 75,
  },

  // ── MAJOR CLANS ───────────────────────────────────────────────────────
  {
    name: "Clan Stonehaven",
    tier: "Major",
    icon: "⛏",
    color: "#d89050",
    desc: "Master craftsmen who built half the fortresses in Ironhold.",
    bloodlineAffinity: ["Dwarvish", "Common"],
    realmAffinity: "Ironhold",
    statBonus: { strength: 10, education: 8, wealth: 8 },
    wealthBonus: 12,
    startingReputation: 20,
    power: 190,
  },
  {
    name: "House Ravenwatch",
    tier: "Major",
    icon: "🪶",
    color: "#9870d0",
    desc: "Shadow brokers who trade in secrets and favors across the realm.",
    bloodlineAffinity: ["Void", "Undead"],
    realmAffinity: "Shadowmere",
    statBonus: { intelligence: 10, charisma: 8, infamy: 5 },
    wealthBonus: 10,
    startingReputation: 18,
    power: 210,
  },
  {
    name: "Clan Feng",
    tier: "Major",
    icon: "⚡",
    color: "#f0a030",
    desc: "A lineage of cultivators known for lightning-fast cultivation breakthroughs.",
    bloodlineAffinity: ["Common", "Draconic"],
    realmAffinity: "Arcanum",
    statBonus: { magic: 12, intelligence: 8 },
    wealthBonus: 8,
    startingReputation: 22,
    power: 230,
  },
  {
    name: "Dynasty Lin",
    tier: "Major",
    icon: "✦",
    color: "#60c8d0",
    desc: "Scholars and diplomats who have served five kingdoms in three centuries.",
    bloodlineAffinity: ["Elven", "Common"],
    statBonus: { intelligence: 12, charisma: 8, education: 10 },
    wealthBonus: 10,
    startingReputation: 25,
    power: 200,
  },
  {
    name: "Circle Qing",
    tier: "Major",
    icon: "🌸",
    color: "#e890d0",
    desc: "An ancient mystical circle tracing back to the first Fae courts.",
    bloodlineAffinity: ["Fae", "Celestial"],
    realmAffinity: "Sylvara",
    statBonus: { magic: 10, luck: 10, faith: 8 },
    wealthBonus: 6,
    startingReputation: 20,
    power: 215,
  },

  // ── GRAND CLANS ───────────────────────────────────────────────────────
  {
    name: "House Xiao",
    tier: "Grand",
    icon: "🐉",
    color: "#e04060",
    desc: "Descendants of the First Dragon Emperor. Their bloodline runs hot with ancient fire.",
    bloodlineAffinity: ["Draconic"],
    realmAffinity: "Celestia",
    statBonus: { strength: 15, magic: 12, reputation: 15, charisma: 10 },
    wealthBonus: 20,
    startingReputation: 40,
    power: 480,
  },
  {
    name: "Clan Moonshadow",
    tier: "Grand",
    icon: "🌙",
    color: "#7080d0",
    desc: "A wolf clan bound by lunar oaths. Their transformations are legendary.",
    bloodlineAffinity: ["Werewolf", "Void"],
    realmAffinity: "Shadowmere",
    statBonus: { strength: 12, magic: 10, luck: 8, health: 12 },
    wealthBonus: 15,
    startingReputation: 35,
    power: 420,
  },
  {
    name: "Empire Vaelthorn",
    tier: "Grand",
    icon: "🌿",
    color: "#50d080",
    desc: "Nature-walkers who commune with elder spirits and forest gods.",
    bloodlineAffinity: ["Elven", "Fae", "Merfolk"],
    realmAffinity: "Sylvara",
    statBonus: { magic: 15, health: 10, relationships: 12 },
    wealthBonus: 15,
    startingReputation: 38,
    power: 440,
  },
  {
    name: "Order of Crimson Runes",
    tier: "Grand",
    icon: "⬡",
    color: "#e03060",
    desc: "Rune smiths who forged the seven legendary weapons of the ancient war.",
    bloodlineAffinity: ["Dwarvish", "Void"],
    realmAffinity: "Ironhold",
    statBonus: { intelligence: 15, strength: 10, magic: 12 },
    wealthBonus: 18,
    startingReputation: 40,
    power: 460,
  },

  // ── ROYAL CLANS ───────────────────────────────────────────────────────
  {
    name: "Royal House Solaris",
    tier: "Royal",
    icon: "☀",
    color: "#f0d040",
    desc: "Blessed by the sun itself. Divine monarchs who have ruled Celestia for eight centuries.",
    bloodlineAffinity: ["Celestial", "Elven"],
    realmAffinity: "Celestia",
    statBonus: { charisma: 18, faith: 15, reputation: 20, wealth: 15 },
    wealthBonus: 35,
    startingReputation: 65,
    power: 720,
  },
  {
    name: "Dynasty of Eternal Night",
    tier: "Royal",
    icon: "🌑",
    color: "#a040d0",
    desc: "Undying rulers who conquered death and built an empire from the darkness.",
    bloodlineAffinity: ["Undead", "Void"],
    realmAffinity: "Shadowmere",
    statBonus: { magic: 18, infamy: 12, health: 10, intelligence: 15 },
    wealthBonus: 30,
    startingReputation: 55,
    power: 750,
  },
  {
    name: "Clan Ironblood",
    tier: "Royal",
    icon: "⚔",
    color: "#d04040",
    desc: "Conquerors whose war banners have flown over a hundred fallen kingdoms.",
    bloodlineAffinity: ["Orcish", "Draconic"],
    realmAffinity: "Aethoria",
    statBonus: { strength: 20, reputation: 15, infamy: 10, career: 12 },
    wealthBonus: 28,
    startingReputation: 60,
    power: 700,
  },

  // ── IMPERIAL CLANS ────────────────────────────────────────────────────
  {
    name: "Empire of the Jade Throne",
    tier: "Imperial",
    icon: "🐉",
    color: "#40d080",
    desc: "The oldest living empire, spanning seven realms. Their word is law.",
    bloodlineAffinity: ["Draconic", "Celestial"],
    statBonus: { charisma: 20, reputation: 25, wealth: 20, intelligence: 15 },
    wealthBonus: 55,
    startingReputation: 85,
    power: 1200,
  },
  {
    name: "The Infernal Court",
    tier: "Imperial",
    icon: "🔥",
    color: "#e03020",
    desc: "Rulers of the infernal planes. Their ambition burns hotter than any flame.",
    bloodlineAffinity: ["Infernal"],
    realmAffinity: "Infernus",
    statBonus: { strength: 20, magic: 20, infamy: 20, charisma: 15 },
    wealthBonus: 50,
    startingReputation: 70,
    power: 1300,
  },
  {
    name: "The Void Conclave",
    tier: "Imperial",
    icon: "◈",
    color: "#8040ff",
    desc: "Masters of void energy who rewrote the laws of existence itself.",
    bloodlineAffinity: ["Void"],
    realmAffinity: "Voidmere",
    statBonus: { magic: 25, intelligence: 20, luck: -5, health: -5 },
    wealthBonus: 40,
    startingReputation: 75,
    power: 1400,
  },

  // ── LEGENDARY CLANS ───────────────────────────────────────────────────
  {
    name: "The Celestial Mandate",
    tier: "Legendary",
    icon: "✵",
    color: "#ffd700",
    desc: "Chosen by heaven itself. Said to be the bloodline of the first god.",
    bloodlineAffinity: ["Celestial", "Elven"],
    realmAffinity: "Celestia",
    statBonus: { faith: 30, magic: 25, charisma: 20, reputation: 30 },
    wealthBonus: 80,
    startingReputation: 100,
    power: 2500,
  },
  {
    name: "The Undying Dynasty",
    tier: "Legendary",
    icon: "💀",
    color: "#c0a8ff",
    desc: "They have outlasted three ages of the world. Death is merely an inconvenience.",
    bloodlineAffinity: ["Undead", "Void"],
    statBonus: { health: 20, magic: 30, intelligence: 25, infamy: 20 },
    wealthBonus: 75,
    startingReputation: 95,
    power: 2800,
  },
  {
    name: "Order of the First Flame",
    tier: "Legendary",
    icon: "🔥",
    color: "#ff6020",
    desc: "Guardians of the primordial fire. Their cultivation secrets predate written history.",
    bloodlineAffinity: ["Draconic", "Infernal"],
    statBonus: { magic: 30, strength: 25, reputation: 25, luck: 10 },
    wealthBonus: 70,
    startingReputation: 100,
    power: 3000,
  },
];

export function getClanByName(name: string): ClanDef | undefined {
  return CLANS.find(c => c.name === name);
}

export function getClansByTier(tier: ClanTier): ClanDef[] {
  return CLANS.filter(c => c.tier === tier);
}

export function getRandomClanForBloodline(bloodline: string, isBossMode: boolean): ClanDef {
  const eligible = CLANS.filter(c => {
    if (c.name === "None") return false;
    if (isBossMode) return c.tier !== "Wanderer";
    const maxTier = isBossMode ? 6 : 2;
    return CLAN_TIERS[c.tier].rank <= maxTier;
  });

  const affinity = eligible.filter(c => c.bloodlineAffinity?.includes(bloodline));
  const pool = affinity.length > 0 ? affinity : eligible;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getClanRankLabel(power: number): string {
  if (power >= 2000) return "Mythic";
  if (power >= 1000) return "Supreme";
  if (power >= 500)  return "Elite";
  if (power >= 200)  return "Rising";
  if (power >= 80)   return "Known";
  return "Obscure";
}
