import type { StatKey, MysticalPath } from "./types";

export type JobTier = "common" | "skilled" | "expert" | "elite" | "legendary";

export interface JobDef {
  id: string;
  title: string;
  icon: string;
  desc: string;
  tier: JobTier;
  incomeMin: number;
  incomeMax: number;
  reqStats?: Partial<Record<StatKey, number>>;
  minAge?: number;
  bloodlineAffinity?: string[];
  mysticalPath?: MysticalPath;
  realmAffinity?: string[];
  color: string;
  statGain?: Partial<Record<StatKey, number>>;
}

export const JOB_TIER_COLORS: Record<JobTier, string> = {
  common:    "#8898a8",
  skilled:   "#60c8a0",
  expert:    "#8080f0",
  elite:     "#f0c840",
  legendary: "#ff6040",
};

export const JOBS: JobDef[] = [
  // ── COMMON ────────────────────────────────────────────────────────────
  {
    id: "laborer",
    title: "Day Laborer",
    icon: "⛏",
    desc: "Carry stones, dig ditches, move crates. Honest but backbreaking.",
    tier: "common",
    incomeMin: 3, incomeMax: 6,
    minAge: 10,
    color: "#8898a8",
    statGain: { strength: 1 },
  },
  {
    id: "street_vendor",
    title: "Street Vendor",
    icon: "🛒",
    desc: "Hawk goods in the market square. Every coin counts.",
    tier: "common",
    incomeMin: 4, incomeMax: 8,
    minAge: 12,
    color: "#8898a8",
    statGain: { charisma: 1 },
  },
  {
    id: "farm_hand",
    title: "Farm Hand",
    icon: "🌾",
    desc: "Tend crops, feed animals, work the land from dawn to dusk.",
    tier: "common",
    incomeMin: 3, incomeMax: 7,
    minAge: 10,
    color: "#8898a8",
    statGain: { health: 1 },
  },
  {
    id: "town_guard",
    title: "Town Guard",
    icon: "🛡",
    desc: "Keep the peace, watch the gates, look intimidating.",
    tier: "common",
    incomeMin: 5, incomeMax: 9,
    minAge: 16,
    reqStats: { strength: 20 },
    color: "#8898a8",
    statGain: { strength: 1, reputation: 1 },
  },
  {
    id: "scribe",
    title: "Scribe",
    icon: "📜",
    desc: "Copy documents for merchants and nobles. Steady, quiet work.",
    tier: "common",
    incomeMin: 5, incomeMax: 9,
    minAge: 14,
    reqStats: { intelligence: 20, education: 15 },
    color: "#8898a8",
    statGain: { intelligence: 1 },
  },

  // ── SKILLED ───────────────────────────────────────────────────────────
  {
    id: "merchant",
    title: "Traveling Merchant",
    icon: "💰",
    desc: "Buy low, sell high. Read the markets, charm the buyers.",
    tier: "skilled",
    incomeMin: 10, incomeMax: 20,
    minAge: 16,
    reqStats: { charisma: 30, intelligence: 25 },
    color: "#60c8a0",
    statGain: { charisma: 1, wealth: 1 },
  },
  {
    id: "healer",
    title: "Healer",
    icon: "💊",
    desc: "Tend to the sick and wounded. Respected across all walks of life.",
    tier: "skilled",
    incomeMin: 10, incomeMax: 18,
    minAge: 16,
    reqStats: { intelligence: 30, faith: 20 },
    color: "#60c8a0",
    statGain: { relationships: 2 },
  },
  {
    id: "blacksmith",
    title: "Blacksmith",
    icon: "⚒",
    desc: "Forge weapons and tools. Your craft speaks louder than words.",
    tier: "skilled",
    incomeMin: 12, incomeMax: 22,
    minAge: 16,
    reqStats: { strength: 35 },
    bloodlineAffinity: ["Dwarvish", "Orcish"],
    color: "#60c8a0",
    statGain: { strength: 2 },
  },
  {
    id: "soldier",
    title: "Soldier",
    icon: "⚔",
    desc: "Serve under a lord's banner. Pay is steady. Risk is real.",
    tier: "skilled",
    incomeMin: 12, incomeMax: 20,
    minAge: 18,
    reqStats: { strength: 35, health: 40 },
    color: "#60c8a0",
    statGain: { strength: 2, career: 1 },
  },
  {
    id: "scholar",
    title: "Scholar",
    icon: "📚",
    desc: "Teach, research, and publish. Knowledge is wealth of a different kind.",
    tier: "skilled",
    incomeMin: 10, incomeMax: 18,
    minAge: 18,
    reqStats: { intelligence: 40, education: 35 },
    color: "#60c8a0",
    statGain: { intelligence: 2, education: 1 },
  },
  {
    id: "bard",
    title: "Bard",
    icon: "🎶",
    desc: "Sing, perform, tell stories. Fame can be its own currency.",
    tier: "skilled",
    incomeMin: 8, incomeMax: 22,
    minAge: 16,
    reqStats: { charisma: 40 },
    bloodlineAffinity: ["Fae", "Merfolk", "Celestial"],
    color: "#60c8a0",
    statGain: { charisma: 2, reputation: 1 },
  },
  {
    id: "mage_for_hire",
    title: "Mage-for-Hire",
    icon: "✦",
    desc: "Sell your magical talents to whoever pays. Discretion costs extra.",
    tier: "skilled",
    incomeMin: 14, incomeMax: 28,
    minAge: 18,
    reqStats: { magic: 40 },
    mysticalPath: "arcane_magic",
    color: "#60c8a0",
    statGain: { magic: 2 },
  },
  {
    id: "qi_instructor",
    title: "Qi Instructor",
    icon: "⚡",
    desc: "Teach cultivation basics to wealthy disciples. Prestige and pay.",
    tier: "skilled",
    incomeMin: 15, incomeMax: 25,
    minAge: 20,
    reqStats: { magic: 45 },
    mysticalPath: "cultivation",
    color: "#60c8a0",
    statGain: { magic: 2, reputation: 1 },
  },

  // ── EXPERT ────────────────────────────────────────────────────────────
  {
    id: "master_merchant",
    title: "Master Merchant",
    icon: "🏪",
    desc: "Run a trading empire. Your name opens doors gold cannot.",
    tier: "expert",
    incomeMin: 25, incomeMax: 50,
    minAge: 22,
    reqStats: { charisma: 55, intelligence: 50, wealth: 40 },
    color: "#8080f0",
    statGain: { wealth: 2, charisma: 1 },
  },
  {
    id: "court_advisor",
    title: "Court Advisor",
    icon: "📋",
    desc: "Whisper in the ears of kings. Knowledge is your true weapon.",
    tier: "expert",
    incomeMin: 28, incomeMax: 55,
    minAge: 25,
    reqStats: { intelligence: 60, charisma: 50, reputation: 40 },
    color: "#8080f0",
    statGain: { intelligence: 2, reputation: 2 },
  },
  {
    id: "commander",
    title: "Military Commander",
    icon: "🏹",
    desc: "Lead armies into battle. Glory and coin come to those who win.",
    tier: "expert",
    incomeMin: 30, incomeMax: 55,
    minAge: 25,
    reqStats: { strength: 60, reputation: 40, career: 35 },
    color: "#8080f0",
    statGain: { reputation: 2, career: 2 },
  },
  {
    id: "grand_healer",
    title: "Grand Healer",
    icon: "✵",
    desc: "Your name is spoken with reverence in halls of power.",
    tier: "expert",
    incomeMin: 25, incomeMax: 50,
    minAge: 25,
    reqStats: { intelligence: 55, faith: 45, relationships: 40 },
    color: "#8080f0",
    statGain: { reputation: 2, faith: 1 },
  },
  {
    id: "archmage_apprentice",
    title: "Archmage's Hand",
    icon: "🔮",
    desc: "Serve the Archmage directly. Power flows both ways.",
    tier: "expert",
    incomeMin: 30, incomeMax: 60,
    minAge: 22,
    reqStats: { magic: 65, intelligence: 55 },
    color: "#8080f0",
    statGain: { magic: 3, intelligence: 1 },
  },
  {
    id: "rune_artisan",
    title: "Rune Artisan",
    icon: "⬡",
    desc: "Craft rune-etched weapons and armor for the wealthy.",
    tier: "expert",
    incomeMin: 28, incomeMax: 55,
    minAge: 22,
    reqStats: { magic: 60, intelligence: 50 },
    mysticalPath: "rune_smith",
    color: "#8080f0",
    statGain: { magic: 3 },
  },
  {
    id: "sacred_cleric",
    title: "Sacred Cleric",
    icon: "☀",
    desc: "Minister to the faithful. Divine favor and coin both flow.",
    tier: "expert",
    incomeMin: 25, incomeMax: 50,
    minAge: 22,
    reqStats: { faith: 60, charisma: 45 },
    mysticalPath: "sacred_arts",
    bloodlineAffinity: ["Celestial", "Elven"],
    color: "#8080f0",
    statGain: { faith: 3, reputation: 1 },
  },

  // ── ELITE ─────────────────────────────────────────────────────────────
  {
    id: "sect_elder",
    title: "Sect Elder",
    icon: "🌀",
    desc: "Lead a cultivation sect. Disciples. Tribute. Power.",
    tier: "elite",
    incomeMin: 60, incomeMax: 120,
    minAge: 30,
    reqStats: { magic: 80, reputation: 60, career: 50 },
    color: "#f0c840",
    statGain: { reputation: 3, magic: 2 },
  },
  {
    id: "royal_chancellor",
    title: "Royal Chancellor",
    icon: "👑",
    desc: "Second only to the monarch. You run the kingdom in all but name.",
    tier: "elite",
    incomeMin: 70, incomeMax: 130,
    minAge: 35,
    reqStats: { intelligence: 80, charisma: 70, reputation: 70 },
    color: "#f0c840",
    statGain: { reputation: 3, charisma: 2 },
  },
  {
    id: "grand_archmage",
    title: "Grand Archmage",
    icon: "✦",
    desc: "The supreme magical authority. Your spells reshape the world.",
    tier: "elite",
    incomeMin: 80, incomeMax: 150,
    minAge: 35,
    reqStats: { magic: 90, intelligence: 75, reputation: 60 },
    color: "#f0c840",
    statGain: { magic: 4, reputation: 2 },
  },
  {
    id: "warlord",
    title: "Warlord",
    icon: "⚔",
    desc: "Conquer. Tax. Expand. Repeat. War is your profession and passion.",
    tier: "elite",
    incomeMin: 65, incomeMax: 140,
    minAge: 30,
    reqStats: { strength: 85, infamy: 40, career: 60 },
    bloodlineAffinity: ["Orcish", "Draconic", "Infernal"],
    color: "#f0c840",
    statGain: { strength: 3, reputation: 2 },
  },

  // ── LEGENDARY ─────────────────────────────────────────────────────────
  {
    id: "world_cultivator",
    title: "World Cultivator",
    icon: "⚡",
    desc: "Your cultivation touches the heavens. Lesser cultivators bow at your approach.",
    tier: "legendary",
    incomeMin: 150, incomeMax: 300,
    minAge: 40,
    reqStats: { magic: 100, reputation: 90, intelligence: 80 },
    color: "#ff6040",
    statGain: { magic: 5, reputation: 3 },
  },
  {
    id: "immortal_sage",
    title: "Immortal Sage",
    icon: "✵",
    desc: "A being who has transcended mortality. Your wisdom reshapes civilizations.",
    tier: "legendary",
    incomeMin: 180, incomeMax: 350,
    minAge: 50,
    reqStats: { magic: 100, intelligence: 100, faith: 80 },
    bloodlineAffinity: ["Celestial", "Elven", "Undead"],
    color: "#ff6040",
    statGain: { reputation: 5, faith: 3 },
  },
];

export function getAvailableJobs(
  age: number,
  stats: Record<StatKey, number>,
  bloodline: string,
  mysticalPath: MysticalPath,
): JobDef[] {
  return JOBS.filter(job => {
    if (job.minAge && age < job.minAge) return false;
    if (job.reqStats) {
      for (const [k, v] of Object.entries(job.reqStats)) {
        if ((stats[k as StatKey] ?? 0) < v) return false;
      }
    }
    if (job.mysticalPath && mysticalPath !== job.mysticalPath) return false;
    return true;
  });
}

export function getJobIncome(job: JobDef, stats: Record<StatKey, number>, talent: string): number {
  const base = job.incomeMin + Math.random() * (job.incomeMax - job.incomeMin);
  const wealthSkill = (stats.wealth ?? 0) / 100;
  const careerSkill = (stats.career ?? 0) / 100;
  const skillBonus = (wealthSkill + careerSkill) * 0.3;
  const talentMult = talent === "Legendary" ? 2 : talent === "Prodigy" ? 1.5 : talent === "Gifted" ? 1.25 : talent === "Above Average" ? 1.1 : 1;
  return Math.round(base * (1 + skillBonus) * talentMult);
}
