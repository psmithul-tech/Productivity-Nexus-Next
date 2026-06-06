import React, { createContext, useContext, useState, useEffect } from "react";
import {
  GameState, Gender, Realm, Bloodline, Stats, RomanceLevel, MysticalPath,
  PROPERTY_CATEGORIES, PropertyType, Partner, ChildRecord, InheritedSoul, PartnerRole,
  Talent, OutfitStyle, Accessory, FamilyMember, OwnedProperty, FocusStance, CharacterAppearance
} from "./types";
import { getRandomEvent, GameEvent } from "./events";
import {
  CultivatorRank, CULTIVATOR_RANKS, RANK_EXP_THRESHOLDS, tryAdvanceRank,
} from "./cultivator";
import { TALENTS, applyTalentToEffects } from "./talents";
import { getFamilyRank, getCosmicTier } from "./imperialScale";
import { getLocationsForRealm, MapLocation } from "./realmMap";
import { WorldState, initWorldState, advanceWorldYear, loadWorldState, saveWorldState } from "./worldSim";
import { getClanByName, getRandomClanForBloodline } from "./clanSystem";
import { JOBS, getJobIncome } from "./jobSystem";
import { SCENARIOS } from "./scenarios";

export function getMaxActionsPerYear(state: GameState): number {
  let base = 3;
  if (state.mysticalPath !== "none") base += 1;
  if (state.mysticalTier >= 5)  base += 1;
  if (state.mysticalTier >= 10) base += 1;
  if (state.mysticalTier >= 15) base += 1;
  if (state.traits.includes("Gifted")) base += 1;
  base += TALENTS[state.talent ?? "Average"].actionBonus;
  return Math.max(1, base);
}

export interface Activity {
  key: string;
  label: string;
  icon: string;
  category: "crime" | "love" | "mind" | "health" | "lifestyle" | "legal" | "cultivation" | "arcane" | "sacred" | "rune";
  desc: string;
  effects: Partial<Stats>;
  log: string;
  logExplicit?: string;
  cost?: number;
  minAge?: number;
  riskChance?: number;
  failEffects?: Partial<Stats>;
  failLog?: string;
  propertyGain?: PropertyType;
  reqStat?: { key: keyof Stats; min: number };
  reqPath?: MysticalPath;
  cultivatorExp?: number;
  mysticalExp?: number;
  addsPartner?: PartnerRole;
  addsChild?: boolean;
  reqPartner?: boolean;
  upgradesPartner?: PartnerRole;
}

const PARTNER_NAMES_F = ["Lyria","Seraphina","Vera","Isolde","Amara","Celeste","Mirelle","Thaïs","Riona","Zephyrine","Aelindra","Nyx","Solene","Kaeda","Ysmay"];
const PARTNER_NAMES_M = ["Aldric","Varen","Theron","Cassian","Dorian","Eryx","Falken","Galen","Harlen","Idris","Jace","Kael","Lorcan","Mael","Niran"];
const CHILD_NAMES_F = ["Aria","Lyra","Sera","Nyx","Zoe","Elara","Mira","Thia","Kaia","Vela","Luna","Sora","Rhea","Asha","Nova"];
const CHILD_NAMES_M = ["Arlo","Zeno","Kai","Ren","Orion","Lian","Felix","Dax","Cael","Bran","Taro","Solen","Ryn","Iven","Jax"];
const FAMILY_NAMES_GENERIC = [
  "Ashford","Blackwood","Coldwater","Duskmantle","Embervale","Frostholm",
  "Goldenleaf","Highcrest","Ironveil","Jadepath","Kindlewood","Lorewind",
  "Moonrise","Nightfall","Oakmere","Peakstone","Quillmark","Ravenwatch",
  "Stonehaven","Thornfield","Underhill","Valegard","Whitecrest","Xanford",
  "Yewdale","Zephyr",
];

function randomName(gender: Gender, pool?: string[]): string {
  if (pool) return pool[Math.floor(Math.random() * pool.length)];
  if (gender === "Female") return PARTNER_NAMES_F[Math.floor(Math.random() * PARTNER_NAMES_F.length)];
  if (gender === "Male") return PARTNER_NAMES_M[Math.floor(Math.random() * PARTNER_NAMES_M.length)];
  return [...PARTNER_NAMES_F, ...PARTNER_NAMES_M][Math.floor(Math.random() * (PARTNER_NAMES_F.length + PARTNER_NAMES_M.length))];
}

function randomChildGender(): Gender {
  return Math.random() < 0.5 ? "Male" : "Female";
}

function randomChildName(gender: Gender): string {
  if (gender === "Female") return CHILD_NAMES_F[Math.floor(Math.random() * CHILD_NAMES_F.length)];
  return CHILD_NAMES_M[Math.floor(Math.random() * CHILD_NAMES_M.length)];
}

function generateFamilyMembers(bloodline: Bloodline, name: string): FamilyMember[] {
  const members: FamilyMember[] = [];
  const fatherAlive = Math.random() < 0.6;
  const motherAlive = Math.random() < 0.65;
  members.push({ id: crypto.randomUUID(), name: randomName("Male"), relation: "father", alive: fatherAlive, bloodline, affection: 70, age: 25 + Math.floor(Math.random() * 15) });
  members.push({ id: crypto.randomUUID(), name: randomName("Female"), relation: "mother", alive: motherAlive, bloodline, affection: 80, age: 20 + Math.floor(Math.random() * 15) });
  const siblingCount = Math.floor(Math.random() * 3);
  for (let i = 0; i < siblingCount; i++) {
    const g: Gender = Math.random() < 0.5 ? "Male" : "Female";
    members.push({ id: crypto.randomUUID(), name: randomName(g), relation: "sibling", alive: Math.random() < 0.8, bloodline, affection: 60, age: Math.floor(Math.random() * 10) });
  }
  return members;
}

export const ACTIVITIES: Activity[] = [
  // CRIME
  { key:"pickpocket",label:"Pickpocket",icon:"🤲",category:"crime",desc:"Lift a coin purse from a stranger.",effects:{wealth:5,infamy:3,happiness:-1},log:"slipped a hand into a passing noble's pocket",riskChance:0.3,failEffects:{health:-10,reputation:-15},failLog:"got caught picking a pocket — took a beating",minAge:10},
  { key:"shoplift",label:"Shoplift",icon:"🛍",category:"crime",desc:"Steal goods from a merchant.",effects:{wealth:8,infamy:5,happiness:-1},log:"slipped a few items under a cloak at the market",riskChance:0.25,failEffects:{reputation:-20,happiness:-10},failLog:"was caught shoplifting and publicly humiliated",minAge:12},
  { key:"assault",label:"Assault",icon:"👊",category:"crime",desc:"Attack someone for their valuables.",effects:{wealth:12,infamy:15,strength:3,happiness:-2},log:"mugged a traveler on the road",riskChance:0.35,failEffects:{health:-25,reputation:-20},failLog:"tried to mug someone — they fought back hard",minAge:16},
  { key:"drug_deal",label:"Drug Dealing",icon:"💊",category:"crime",desc:"Sell illicit substances for profit.",effects:{wealth:20,infamy:20,health:-5,relationships:-2},log:"ran a shadow trade in alchemical contraband",riskChance:0.3,failEffects:{health:-15,reputation:-25,infamy:10},failLog:"got caught dealing — barely escaped the guards",minAge:18},
  { key:"bank_robbery",label:"Bank Robbery",icon:"🏦",category:"crime",desc:"Hit the vault. Massive risk, massive reward.",effects:{wealth:40,infamy:30,relationships:-5},log:"orchestrated a daring vault heist",riskChance:0.55,failEffects:{health:-30,reputation:-40,infamy:20},failLog:"the bank robbery went sideways — barely escaped alive",minAge:20,reqStat:{key:"strength",min:40}},
  { key:"arson",label:"Arson",icon:"🔥",category:"crime",desc:"Set something ablaze for profit or vengeance.",effects:{infamy:20,happiness:5,relationships:-3},log:"set fire to a rival's property under cover of night",riskChance:0.4,failEffects:{health:-20,reputation:-30},failLog:"the fire spread — and people saw the face",minAge:16},
  { key:"murder",label:"Murder",icon:"🗡",category:"crime",desc:"Take a life. The darkest path.",effects:{infamy:40,reputation:-30,happiness:-20,health:-5},log:"took a life in cold blood",riskChance:0.5,failEffects:{health:-40,reputation:-50},failLog:"the assassination failed and nearly cost everything",minAge:18,reqStat:{key:"strength",min:50}},
  // LOVE
  { key:"date",label:"Ask Someone Out",icon:"❤",category:"love",desc:"Pursue a romantic connection.",effects:{relationships:10,happiness:8,wealth:-2},log:"went on a wonderful date and met someone captivating",riskChance:0.2,failEffects:{happiness:-5},failLog:"asked someone out — and was turned down flat",minAge:14,addsPartner:"lover"},
  { key:"dating_app",label:"Dating App",icon:"📱",category:"love",desc:"Swipe through potential matches.",effects:{relationships:6,charisma:3,happiness:-1},log:"spent an evening on a dating app — found a match",minAge:18,addsPartner:"lover"},
  { key:"propose",label:"Propose",icon:"💍",category:"love",desc:"Ask a lover to spend eternity together.",effects:{relationships:20,happiness:20,faith:5,wealth:-10},log:"got down on one knee and proposed — they said yes",riskChance:0.15,failEffects:{happiness:-20,relationships:-15},failLog:"the proposal was refused — heartbreak followed",minAge:18,reqStat:{key:"relationships",min:40},reqPartner:true,upgradesPartner:"spouse"},
  { key:"take_consort",label:"Take a Consort",icon:"👑",category:"love",desc:"Take an official consort into your household.",effects:{relationships:15,happiness:12,wealth:-15},log:"took a consort — a beautiful arrangement of mutual benefit",minAge:20,reqStat:{key:"wealth",min:20},addsPartner:"consort"},
  { key:"have_child",label:"Try for an Heir",icon:"👶",category:"love",desc:"Bring new life into the world.",effects:{happiness:15,relationships:10,wealth:-15,health:-2},log:"welcomed a child into the family",minAge:18,reqStat:{key:"relationships",min:30},reqPartner:true,addsChild:true},
  { key:"intimate",label:"Be Intimate",icon:"🔥",category:"love",desc:"A night of passion and closeness.",effects:{happiness:15,relationships:8,health:3,strength:-1},log:"spent an intimate, tender evening together",logExplicit:"shared a night of passionate, uninhibited pleasure — bodies entwined until dawn",minAge:18,reqPartner:true},
  { key:"divorce",label:"Divorce",icon:"💔",category:"love",desc:"End a marriage.",effects:{relationships:-20,wealth:-30,happiness:5},log:"finalized a divorce",minAge:18},
  // MIND & BODY
  { key:"gym",label:"Go to Gym",icon:"💪",category:"mind",desc:"Train your body to its peak.",effects:{strength:6,health:4,happiness:-1},log:"trained hard at the gymnasium",cost:2,minAge:14},
  { key:"meditate",label:"Meditate",icon:"🧘",category:"mind",desc:"Seek stillness and inner peace.",effects:{happiness:8,magic:3,health:3,relationships:-2},log:"sat in deep meditation for hours"},
  { key:"library",label:"Visit Library",icon:"📚",category:"mind",desc:"Expand your mind with ancient tomes.",effects:{intelligence:6,education:5,health:-1,relationships:-1},log:"pored over dusty scrolls all day",cost:1,minAge:6},
  { key:"martial_arts",label:"Martial Arts",icon:"🥋",category:"mind",desc:"Master unarmed combat.",effects:{strength:8,health:4,reputation:3,happiness:-2},log:"trained intensively in unarmed combat",cost:5,minAge:8},
  { key:"music_lessons",label:"Music Lessons",icon:"🎵",category:"mind",desc:"Learn to move hearts through melody.",effects:{charisma:6,happiness:6,wealth:-2},log:"learned new melodies and composed music",cost:4,minAge:6},
  { key:"acting",label:"Acting Lessons",icon:"🎭",category:"mind",desc:"Learn to inhabit other lives.",effects:{charisma:7,reputation:4,wealth:-3},log:"studied stagecraft and performance",cost:4,minAge:10},
  { key:"diet",label:"Diet & Nutrition",icon:"🥗",category:"mind",desc:"Eat clean and feel the difference.",effects:{health:8,happiness:-3},log:"committed to a strict healthy diet",cost:3},
  // HEALTH
  { key:"doctor",label:"See a Doctor",icon:"⚕",category:"health",desc:"Get a check-up and treatment.",effects:{health:15,happiness:-1},log:"visited a physician for a thorough check-up",cost:10,minAge:5},
  { key:"emergency",label:"Emergency Room",icon:"🚨",category:"health",desc:"Urgent care when things get critical.",effects:{health:25,happiness:-3},log:"rushed to the emergency healer",cost:25,minAge:5},
  { key:"psychiatrist",label:"Psychiatrist",icon:"🧠",category:"health",desc:"Treat your mind professionally.",effects:{happiness:15,relationships:5,wealth:-5},log:"opened up to a mind-healer",cost:12,minAge:14},
  { key:"blood_donate",label:"Donate Blood",icon:"🩸",category:"health",desc:"A selfless act.",effects:{reputation:8,faith:5,health:-2,strength:-1},log:"donated blood at the healers' guild",minAge:16},
  { key:"detox",label:"Detox Retreat",icon:"🌿",category:"health",desc:"Cleanse body and spirit.",effects:{health:12,happiness:10,magic:5,relationships:-3},log:"spent a week at a remote detox retreat",cost:20,minAge:18},
  // LIFESTYLE
  { key:"movie",label:"Watch a Show",icon:"🎬",category:"lifestyle",desc:"Escape into a captivating story.",effects:{happiness:6,health:-1},log:"spent an evening enjoying a performance",cost:2},
  { key:"nightclub",label:"Nightclub",icon:"🎉",category:"lifestyle",desc:"Dance, drink, make connections.",effects:{charisma:5,happiness:8,relationships:4,health:-3,wealth:-5},log:"danced until dawn at a lively establishment",cost:8,minAge:18},
  { key:"vacation",label:"Take a Vacation",icon:"🌴",category:"lifestyle",desc:"Travel somewhere beautiful.",effects:{happiness:15,health:8,intelligence:4,relationships:-2},log:"traveled to a breathtaking distant land",cost:20,minAge:16},
  { key:"shopping",label:"Go Shopping",icon:"🛒",category:"lifestyle",desc:"Retail therapy has its merits.",effects:{happiness:8,wealth:-10},log:"splurged on fine goods at the market",cost:10},
  { key:"social_media",label:"Social Media",icon:"📣",category:"lifestyle",desc:"Build an audience.",effects:{reputation:5,charisma:3,happiness:-2,relationships:-1},log:"posted content that spread widely",minAge:14},
  { key:"gambling",label:"Gamble",icon:"🎲",category:"lifestyle",desc:"Test your luck at the table.",effects:{wealth:15,luck:3,health:-2},log:"won big at the gambling hall",riskChance:0.55,failEffects:{wealth:-20,happiness:-10},failLog:"lost badly at the gambling table",cost:5,minAge:18},
  // LEGAL
  { key:"license",label:"Get a License",icon:"📜",category:"legal",desc:"Obtain an official certification.",effects:{reputation:8,career:5,happiness:-2},log:"completed the official licensing requirements",cost:8,minAge:16},
  { key:"write_will",label:"Write a Will",icon:"✍",category:"legal",desc:"Plan your legacy.",effects:{reputation:5,faith:5,happiness:-1},log:"consulted a scribe to draft a formal will",cost:5,minAge:40},
  { key:"lawsuit",label:"File a Lawsuit",icon:"⚖",category:"legal",desc:"Take someone to court.",effects:{wealth:20,reputation:5,happiness:-5,relationships:-5},log:"filed a lawsuit and won a settlement",riskChance:0.45,failEffects:{wealth:-15,reputation:-10,happiness:-10},failLog:"the lawsuit backfired — lost the case",cost:10,minAge:18},
  { key:"emigrate",label:"Emigrate",icon:"✈",category:"legal",desc:"Start fresh in a new land.",effects:{happiness:10,reputation:5,relationships:-8,wealth:-10},log:"emigrated to a distant realm",cost:15,minAge:18},
  { key:"adopt",label:"Adopt a Child",icon:"🏠",category:"legal",desc:"Open your heart and home.",effects:{happiness:12,relationships:10,reputation:8,wealth:-15},log:"formally adopted a child in need",cost:8,minAge:20,reqStat:{key:"relationships",min:20},addsChild:true},
  // CULTIVATION
  { key:"qi_train",label:"Cycle Qi",icon:"⚡",category:"cultivation",desc:"Meditate and cycle your Qi through your meridians.",effects:{magic:8,health:4,strength:4,relationships:-3,happiness:-2},log:"cycled Qi through meridians in deep cultivation",minAge:8,reqPath:"cultivation",cultivatorExp:30},
  { key:"combat_train",label:"Martial Training",icon:"🥊",category:"cultivation",desc:"Train your body as a weapon.",effects:{strength:10,health:5,happiness:-2,relationships:-1},log:"trained martial arts until the stars appeared",cost:3,minAge:10,reqPath:"cultivation",cultivatorExp:20},
  { key:"qi_pill",label:"Consume Qi Pill",icon:"💊",category:"cultivation",desc:"Take a cultivation-enhancing spiritual pill.",effects:{magic:12,health:-3,happiness:-1},log:"consumed a spiritual pill — power surged through every meridian",cost:15,minAge:14,reqPath:"cultivation",cultivatorExp:50},
  { key:"sect_train",label:"Sect Training",icon:"⛩",category:"cultivation",desc:"Train intensively at your sect.",effects:{strength:8,magic:10,reputation:5,relationships:-4,happiness:-2},log:"completed a grueling sect training session",minAge:12,reqPath:"cultivation",cultivatorExp:40},
  // ARCANE MAGIC
  { key:"spell_study",label:"Study Spells",icon:"📖",category:"arcane",desc:"Research new spells and magical theories.",effects:{magic:10,intelligence:6,health:-2,relationships:-3},log:"studied arcane texts until dawn",cost:5,minAge:12,reqPath:"arcane_magic",mysticalExp:25},
  { key:"mana_pool",label:"Expand Mana Pool",icon:"🔵",category:"arcane",desc:"Push your magical reserves to new limits.",effects:{magic:12,health:-5,happiness:-3},log:"pushed magical limits — mana pool expanded painfully",minAge:16,reqPath:"arcane_magic",mysticalExp:35},
  { key:"spell_cast",label:"Practice Casting",icon:"✦",category:"arcane",desc:"Repeatedly cast spells to build control.",effects:{magic:7,charisma:3,reputation:4,health:-1,strength:-1},log:"practiced casting in front of astonished onlookers",minAge:14,reqPath:"arcane_magic",mysticalExp:20},
  // SACRED ARTS
  { key:"prayer",label:"Deep Prayer",icon:"✵",category:"sacred",desc:"Pray intensively for divine blessing.",effects:{faith:12,happiness:8,health:5,relationships:-2,wealth:-1},log:"prayed through the night and felt divine warmth",minAge:8,reqPath:"sacred_arts",mysticalExp:20},
  { key:"holy_rites",label:"Perform Holy Rites",icon:"🕊",category:"sacred",desc:"Perform sacred rites to channel divine power.",effects:{faith:10,reputation:8,magic:5,health:-2,strength:-2},log:"performed sacred rites that made light bloom in darkness",cost:5,minAge:16,reqPath:"sacred_arts",mysticalExp:30},
  // RUNE SMITH
  { key:"rune_inscribe",label:"Inscribe Runes",icon:"⬡",category:"rune",desc:"Carefully inscribe power runes onto your body or gear.",effects:{strength:8,intelligence:6,health:-3,happiness:-2},log:"inscribed a new rune — the pain was exquisite",cost:8,minAge:14,reqPath:"rune_smith",mysticalExp:30},
  { key:"rune_study",label:"Study Rune Texts",icon:"📜",category:"rune",desc:"Study ancient rune inscription manuals.",effects:{intelligence:10,magic:5,health:-1,relationships:-3},log:"spent hours deciphering an ancient rune text",cost:3,minAge:10,reqPath:"rune_smith",mysticalExp:20},
];

const QUIET_YEAR_MSGS = [
  "A quiet year passed without incident.",
  "Life flowed peacefully for a time.",
  "Nothing remarkable happened this year.",
  "A restful year of ordinary days.",
  "The seasons turned without drama.",
  "A calm year — a rare gift.",
  "Time passed slowly and without event.",
  "The year drifted by like smoke in wind.",
  "A season of small joys and forgotten troubles.",
  "Life's rhythm carried you forward quietly.",
  "No great storms came — only steady days.",
  "Another year written in ink too pale to see.",
];

const AGING_MSGS: Array<{ minAge:number; maxAge:number; msg:string }> = [
  { minAge:13, maxAge:13, msg:"You entered your teenage years." },
  { minAge:18, maxAge:18, msg:"You came of age — adulthood beckoned." },
  { minAge:30, maxAge:30, msg:"You turned thirty. The years began to feel different." },
  { minAge:40, maxAge:40, msg:"Middle age crept in quietly." },
  { minAge:50, maxAge:50, msg:"Half a century of living behind you." },
  { minAge:65, maxAge:65, msg:"Grey began to touch your hair." },
  { minAge:80, maxAge:80, msg:"Your joints ached but your spirit endured." },
  { minAge:100, maxAge:100, msg:"A century of life — few achieve this." },
];

const MYSTICAL_TIER_NAMES: Record<string, string[]> = {
  cultivation: ["Mortal Awakening","Qi Gatherer","Qi Foundation","Spirit Disciple","Spirit Master","Profound Realm","Half Martial Artist","Martial Artist","Martial Lord","Half Martial King","Martial King","Martial Emperor","Half Martial Ancestor","Martial Ancestor","Half Martial Exalted","Martial Exalted","Half Martial Immortal","Martial Immortal"],
  arcane_magic: ["Cantrip Learner","Spell Apprentice","Adept Mage","Battle Mage","Archmage","Grand Archmage","Transcendent Mage"],
  sacred_arts: ["Initiate","Acolyte","Blessed One","Holy Warrior","Saint","Archangel Champion","Divine Vessel"],
  rune_smith: ["Scratch Learner","Rune Inscriber","Rune Caster","Rune Master","Rune Lord","Rune Sovereign","Rune God"],
};

export function getMysticalTitle(path: MysticalPath, tier: number): string {
  const names = MYSTICAL_TIER_NAMES[path];
  if (!names) return "";
  return names[Math.min(tier, names.length - 1)] ?? names[names.length - 1];
}

export interface StartGameOptions {
  talent?: Talent;
  familyName?: string;
  outfitStyle?: OutfitStyle;
  accessory?: Accessory;
  bossStats?: Partial<Stats>;
  bossMysticalPath?: MysticalPath;
  isBossMode?: boolean;
  clan?: string;
  scenario?: string;
  appearance?: CharacterAppearance;
}

interface GameContextType {
  state: GameState | null;
  currentEvent: GameEvent | null;
  worldState: WorldState;
  startNewGame: (name:string, gender:Gender, realm:Realm, bloodline:Bloodline, romanceLevel:RomanceLevel, options?: StartGameOptions) => void;
  makeChoice: (choiceIdx:number) => void;
  ageUp: () => Promise<void>;
  isChronicling: boolean;
  doActivity: (key:string) => { success:boolean; log:string };
  doExplore: (locationId: string) => { success:boolean; log:string };
  doJob: (jobId: string) => { success:boolean; log:string };
  doTravel: (targetRealm: Realm) => { success:boolean; log:string };
  clearEvent: () => void;
  quitLife: () => void;
  setStance: (stance: FocusStance) => void;
  continueAsChild: (childIdx: number) => void;
  reincarnate: () => void;
  loadGameState: (gs: GameState) => void;
  pendingSoul: InheritedSoul | null;
  clearPendingSoul: () => void;
  interactPartner: (partnerId: string, action: "chat" | "gift" | "intimate" | "breakup") => { success: boolean; log: string };
  interactFamily: (familyId: string, action: "chat" | "gift" | "argue") => { success: boolean; log: string };
  resolveCutscene: (onClickId: string) => void;
}

const defaultStats = (bloodline: Bloodline): Stats => {
  const base: Stats = {
    health:80, happiness:75, relationships:50, education:10,
    career:0, wealth:10, charisma:50, intelligence:50,
    strength:50, magic:10, reputation:50, faith:10, infamy:0, luck:50,
  };
  const bonuses: Partial<Record<Bloodline, Partial<Stats>>> = {
    Draconic:  { strength:20, magic:20, health:10 },
    Elven:     { intelligence:20, magic:15, luck:10, health:-5 },
    Infernal:  { charisma:20, infamy:15, magic:15, faith:-20 },
    Celestial: { faith:25, reputation:15, magic:10, luck:10 },
    Fae:       { luck:25, charisma:15, magic:15, strength:-10 },
    Werewolf:  { strength:25, health:15, infamy:10 },
    Undead:    { magic:20, infamy:10, health:-15, faith:-10 },
    Void:      { magic:30, luck:-10, intelligence:15, health:-10 },
    Dwarvish:  { strength:15, wealth:15, reputation:10 },
    Orcish:    { strength:25, health:15, reputation:-10, charisma:-5 },
    Merfolk:   { charisma:15, luck:10, magic:10 },
  };
  const bonus = bonuses[bloodline] ?? {};
  const result = { ...base };
  for (const [key, val] of Object.entries(bonus)) {
    const k = key as keyof Stats;
    result[k] = Math.max(0, Math.min(100, result[k] + (val as number)));
  }
  return result;
};

const GameContext = createContext<GameContextType | null>(null);

export const LOCAL_SAVE_KEY = "chronicle_autosave_v1";
export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState]               = useState<GameState | null>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_SAVE_KEY);
      if (raw) return JSON.parse(raw) as GameState;
    } catch {}
    return null;
  });
  const [isChronicling, setIsChronicling] = useState<boolean>(false);
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [pendingSoul, setPendingSoul]   = useState<InheritedSoul | null>(null);
  const [worldState, setWorldState]     = useState<WorldState>(() => loadWorldState());

  useEffect(() => { saveWorldState(worldState); }, [worldState]);

  useEffect(() => {
    if (state) {
      try { localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(state)); } catch {}
    }
  }, [state]);

  const loadGameState = (gs: GameState) => {
    setState(gs);
    setCurrentEvent(null);
  };

  const clampStat = (v: number) => Math.max(0, v);

  const applyStatDelta = (s: GameState, effects: Partial<Stats>): GameState => {
    const ns = { ...s, stats: { ...s.stats } };
    for (const [key, val] of Object.entries(effects)) {
      const k = key as keyof Stats;
      ns.stats[k] = clampStat(ns.stats[k] + (val as number));
    }
    return ns;
  };

  const addLog = (s: GameState, entry: string): GameState => ({
    ...s,
    eventLog: [...s.eventLog, `Age ${s.age}: ${entry}`].slice(-120),
  });

  const checkAchievements = (s: GameState): GameState => {
    const earned: string[] = [];
    if (s.age >= 100 && !s.achievements.includes("centenarian"))       earned.push("centenarian");
    if (s.stats.wealth >= 90 && !s.achievements.includes("wealthy"))    earned.push("wealthy");
    if (s.stats.magic >= 90 && !s.achievements.includes("archmage"))    earned.push("archmage");
    if (s.stats.infamy >= 80 && !s.achievements.includes("villain"))    earned.push("villain");
    if (s.stats.reputation >= 90 && !s.achievements.includes("legend")) earned.push("legend");
    if (s.properties.length >= 5 && !s.achievements.includes("landlord")) earned.push("landlord");
    if (s.properties.length >= 15 && !s.achievements.includes("mogul"))   earned.push("mogul");
    if (s.properties.filter(p => p.category === "Magical").length >= 3 && !s.achievements.includes("arcane_lord")) earned.push("arcane_lord");
    if (s.stats.strength >= 90 && !s.achievements.includes("champion")) earned.push("champion");
    if (s.stats.charisma >= 90 && !s.achievements.includes("charmer"))  earned.push("charmer");
    if (s.mysticalPath === "cultivation" && s.mysticalTier >= 7 && !s.achievements.includes("martial_artist")) earned.push("martial_artist");
    if (s.mysticalPath === "cultivation" && s.mysticalTier >= 11 && !s.achievements.includes("martial_king")) earned.push("martial_king");
    if (s.mysticalPath === "arcane_magic" && s.mysticalTier >= 4 && !s.achievements.includes("true_archmage")) earned.push("true_archmage");
    if (s.mysticalPath === "sacred_arts" && s.mysticalTier >= 4 && !s.achievements.includes("saint")) earned.push("saint");
    if (s.mysticalPath === "rune_smith" && s.mysticalTier >= 4 && !s.achievements.includes("rune_master")) earned.push("rune_master");
    if (s.partners.length >= 3 && !s.achievements.includes("charmed_many")) earned.push("charmed_many");
    if (s.children.length >= 3 && !s.achievements.includes("dynasty")) earned.push("dynasty");
    if ((s.inheritedSoul?.type === "reincarnation") && !s.achievements.includes("reincarnated")) earned.push("reincarnated");
    if ((s.inheritedSoul?.type === "progeny") && !s.achievements.includes("born_of_legend")) earned.push("born_of_legend");
    if (s.isBossMode && s.legacyScore > 5000 && !s.achievements.includes("boss_ascended")) earned.push("boss_ascended");
    if (s.exploredLocations.length >= 5 && !s.achievements.includes("explorer")) earned.push("explorer");
    return earned.length ? { ...s, achievements: [...s.achievements, ...earned] } : s;
  };

  const checkDeath = (s: GameState): GameState => {
    if (s.stats.health <= 0)
      return { ...s, isAlive: false, deathCause: "Succumbed to failing health." };
    let maxAge = 85;
    if (s.bloodline === "Elven")     maxAge = 600;
    if (s.bloodline === "Undead")    maxAge = 200;
    if (s.bloodline === "Void")      maxAge = 120;
    if (s.bloodline === "Celestial") maxAge = 130;
    if (s.stats.magic >= 90) maxAge = Math.max(maxAge, 130);
    if (s.mysticalPath === "cultivation") maxAge = Math.max(maxAge, 100 + s.mysticalTier * 50);
    if (s.age > maxAge + Math.floor(Math.random() * 15))
      return { ...s, isAlive: false, deathCause: "Passed from this world at the end of a long life." };
    return s;
  };

  const computeLegacy = (s: GameState) => {
    let score = Math.round(
      s.properties.length * 50 +
      Object.values(s.stats).reduce((a, b) => a + b, 0) +
      s.age * 8 +
      s.achievements.length * 200 +
      s.mysticalTier * 300 +
      s.children.length * 100 +
      s.exploredLocations.length * 30 +
      (s.inheritedSoul?.legacyBonus ?? 0)
    );
    const activeScenario = SCENARIOS.find(sc => sc.id === s.scenario);
    if (activeScenario) {
      score = Math.floor(score * activeScenario.legacyMultiplier);
    }
    return score;
  };

  const passiveAge = (s: GameState): GameState => {
    const ns = { ...s, stats: { ...s.stats } };
    if (s.age > 40) ns.stats.health = clampStat(ns.stats.health - 1);
    if (s.age > 60) ns.stats.health = clampStat(ns.stats.health - 1);
    if (s.age > 75) ns.stats.health = clampStat(ns.stats.health - 2);
    if (ns.stats.happiness > 55) ns.stats.happiness = clampStat(ns.stats.happiness - 1);
    if (ns.stats.happiness < 45) ns.stats.happiness = clampStat(ns.stats.happiness + 1);
    if (ns.mysticalPath !== "none") {
      ns.mysticalExp = (ns.mysticalExp ?? 0) + 5;
    }
    
    // Apply Stance Modifiers
    if (ns.activeStance) {
      if (ns.activeStance === "Aggressive Expansion") {
        ns.stats.wealth = clampStat(ns.stats.wealth + 8);
        ns.stats.health = clampStat(ns.stats.health - 4);
        ns.stats.luck = clampStat(ns.stats.luck - 4);
      } else if (ns.activeStance === "Deep Cultivation") {
        if (ns.mysticalPath !== "none") ns.mysticalExp += 15;
        ns.stats.intelligence = clampStat(ns.stats.intelligence + 4);
        ns.stats.wealth = clampStat(ns.stats.wealth - 5);
        ns.stats.relationships = clampStat(ns.stats.relationships - 5);
      } else if (ns.activeStance === "Social Climbing") {
        ns.stats.reputation = clampStat(ns.stats.reputation + 6);
        ns.stats.charisma = clampStat(ns.stats.charisma + 6);
        ns.stats.wealth = clampStat(ns.stats.wealth - 6);
        ns.stats.health = clampStat(ns.stats.health - 2);
      } else if (ns.activeStance === "Survival") {
        ns.stats.health = clampStat(ns.stats.health + 8);
        ns.stats.luck = clampStat(ns.stats.luck + 6);
        ns.stats.wealth = clampStat(ns.stats.wealth - 4);
        ns.stats.reputation = clampStat(ns.stats.reputation - 4);
      } else if (ns.activeStance === "Balanced") {
        const statsKeys = Object.keys(ns.stats) as (keyof typeof ns.stats)[];
        const randomKey1 = statsKeys[Math.floor(Math.random() * statsKeys.length)];
        const randomKey2 = statsKeys[Math.floor(Math.random() * statsKeys.length)];
        ns.stats[randomKey1] = clampStat(ns.stats[randomKey1] + 2);
        ns.stats[randomKey2] = clampStat(ns.stats[randomKey2] + 2);
      }
    }
    if (ns.partners.length > 0) {
      ns.stats.happiness = clampStat(ns.stats.happiness + ns.partners.length * 2);
      ns.stats.relationships = clampStat(ns.stats.relationships + ns.partners.length);
      ns.stats.wealth = clampStat(ns.stats.wealth - ns.partners.length * 2);
      ns.partners = ns.partners.map(p => ({
        ...p,
        affection: Math.max(20, p.affection - 3),
        age: p.age + 1,
      }));
    }
    if (ns.children.length > 0) {
      ns.children = ns.children.map(c => ({ ...c, age: c.age + 1 }));
    }
    return ns;
  };

  const checkMysticalAdvance = (s: GameState): GameState => {
    if (s.mysticalPath === "none") return s;
    
    // Cultivation path uses custom logic
    if (s.mysticalPath === "cultivation") {
      const currentRank = CULTIVATOR_RANKS[s.mysticalTier] || "Mortal Awakening";
      const result = tryAdvanceRank(
        currentRank,
        s.mysticalExp ?? 0,
        s.stats.magic,
        s.stats.intelligence,
        s.stats.strength
      );
      
      if (result.advanced) {
        let newS = { ...s, mysticalTier: s.mysticalTier + 1, mysticalExp: result.newExp };
        if (result.grantedAbility && !newS.abilities?.includes(result.grantedAbility)) {
          newS.abilities = [...(newS.abilities || []), result.grantedAbility];
        }
        return addLog(newS, `⚡ BREAKTHROUGH! Advanced to ${result.newRank}!${result.grantedAbility ? ` Gained ability: ${result.grantedAbility}` : ''}`);
      } else if (result.consequence !== "none") {
        let newS = { ...s, mysticalExp: result.newExp };
        if (result.consequence === "drop_rank") {
          newS.mysticalTier = Math.max(0, newS.mysticalTier - 1);
          newS = addLog(newS, `💀 BOTTLENECK FAILURE! Your foundation crumbled during the trial. You dropped to ${result.newRank}!`);
        } else if (result.consequence === "stat_loss") {
          newS.stats = {
            ...newS.stats,
            magic: Math.max(0, newS.stats.magic - 15),
            health: Math.max(0, newS.stats.health - 20)
          };
          newS = addLog(newS, `💀 BOTTLENECK FAILURE! The violent backlash permanently damaged your meridians. Lost significant Health and Magic!`);
        } else if (result.consequence === "severe_injury") {
          newS.stats = {
            ...newS.stats,
            health: Math.max(0, newS.stats.health - 30)
          };
          newS = addLog(newS, `💀 BOTTLENECK FAILURE! You coughed up blood. Your life force was severely drained (-30 Health).`);
        }
        return newS;
      } else {
        if ((s.mysticalExp ?? 0) !== result.newExp) {
           return addLog({ ...s, mysticalExp: result.newExp }, "Attempted a breakthrough… but the heavens resisted.");
        }
        return s;
      }
    }

    // Generic logic for other paths
    const tiers = MYSTICAL_TIER_NAMES[s.mysticalPath];
    if (!tiers || s.mysticalTier >= tiers.length - 1) return s;
    const expNeeded = 100 + s.mysticalTier * 80;
    if ((s.mysticalExp ?? 0) < expNeeded) return s;
    
    const isBottleneck = s.mysticalTier >= 2;
    const statBonus = (s.stats.magic + s.stats.health + s.stats.intelligence) / 3;
    const baseChance = Math.max(0.2, 0.85 - s.mysticalTier * 0.1);
    const chance = isBottleneck ? baseChance + (statBonus / 200) : Math.max(0.3, 0.85 - s.mysticalTier * 0.05);

    const newTier = s.mysticalTier + 1;
    const newTitle = tiers[newTier] ?? tiers[tiers.length - 1];

    if (Math.random() < chance) {
      return addLog({ ...s, mysticalTier: newTier, mysticalExp: 0 },
        `⚡ BREAKTHROUGH! ${isBottleneck ? 'You survived the Bottleneck Trial and ' : ''}Advanced to ${newTitle}!`);
    }

    // Failed
    if (isBottleneck) {
      // True Failure State
      const failRoll = Math.random();
      let newS = { ...s, mysticalExp: Math.floor(expNeeded * 0.5) }; // lose half exp needed
      
      if (failRoll < 0.25 && newS.mysticalTier > 0) {
        // Drop a rank
        newS.mysticalTier -= 1;
        newS = addLog(newS, `💀 BOTTLENECK FAILURE! Your foundation crumbled during the trial. You dropped to ${tiers[newS.mysticalTier]}!`);
      } else if (failRoll < 0.55) {
        // Irreversible stat loss
        newS.stats = {
          ...newS.stats,
          magic: Math.max(0, newS.stats.magic - 15),
          health: Math.max(0, newS.stats.health - 20)
        };
        newS = addLog(newS, `💀 BOTTLENECK FAILURE! The violent backlash permanently damaged your meridians. Lost significant Health and Magic!`);
      } else if (newS.properties.length > 0) {
        // Lose property to debt
        const lostProp = newS.properties.pop();
        newS = addLog(newS, `💀 BOTTLENECK FAILURE! You survived, but the medicinal herbs to save your life cost a fortune. You had to sell your ${lostProp?.type}.`);
      } else {
        // Just severe health loss
        newS.stats = {
          ...newS.stats,
          health: Math.max(0, newS.stats.health - 30)
        };
        newS = addLog(newS, `💀 BOTTLENECK FAILURE! You coughed up blood. Your life force was severely drained (-30 Health).`);
      }
      return newS;
    }

    return addLog({ ...s, mysticalExp: Math.floor(expNeeded * 0.85) },
      "Attempted a breakthrough… but the heavens resisted.");
  };

  const startNewGame = (
    name: string,
    gender: Gender,
    realm: Realm,
    bloodline: Bloodline,
    romanceLevel: RomanceLevel,
    options?: StartGameOptions
  ) => {
    const talent: Talent = options?.talent ?? "Average";
    const familyName = options?.familyName ?? FAMILY_NAMES_GENERIC[Math.floor(Math.random() * FAMILY_NAMES_GENERIC.length)];
    const outfitStyle: OutfitStyle = options?.outfitStyle ?? "warrior";
    const accessory: Accessory = options?.accessory ?? "none";
    const isBossMode = options?.isBossMode ?? false;
    const scenarioId = options?.scenario ?? "commoner";
    const scenarioDef = SCENARIOS.find(s => s.id === scenarioId) || SCENARIOS[0];

    let baseStats = defaultStats(bloodline);

    // Boss mode: override stats
    if (isBossMode && options?.bossStats) {
      for (const [k, v] of Object.entries(options.bossStats)) {
        const key = k as keyof Stats;
        baseStats[key] = Math.max(0, Math.min(100, v as number));
      }
    }

    // Soul bonuses from reincarnation
    const soul = pendingSoul;
    if (soul) {
      for (const [k, v] of Object.entries(soul.statBonus)) {
        const key = k as keyof Stats;
        baseStats[key] = Math.min(100, baseStats[key] + (v as number));
      }
    }

    // Apply scenario stats
    for (const [k, v] of Object.entries(scenarioDef.statsModifiers)) {
      const key = k as keyof Stats;
      baseStats[key] = Math.max(0, Math.min(100, baseStats[key] + (v as number)));
    }

    // Family rank gives starting wealth bonus
    const tempLegacy = soul?.legacyBonus ?? 0;
    const familyRankDef = getFamilyRank(tempLegacy, 0);
    if (!isBossMode) {
      baseStats.wealth = Math.min(100, baseStats.wealth + familyRankDef.wealthBonus + scenarioDef.startingWealth);
    } else {
      baseStats.wealth = Math.min(100, baseStats.wealth + scenarioDef.startingWealth);
    }

    const familyMembers = generateFamilyMembers(bloodline, name);
    const cosmicTierDef = getCosmicTier(tempLegacy);

    // Clan selection and bonuses
    let chosenClan: string | undefined;
    if (options?.clan && options.clan !== "None") {
      chosenClan = options.clan;
    } else if (!isBossMode) {
      const randomClan = getRandomClanForBloodline(bloodline, false);
      chosenClan = randomClan?.name;
    }
    const clanDef = chosenClan ? getClanByName(chosenClan) : undefined;
    if (clanDef) {
      for (const [k, v] of Object.entries(clanDef.statBonus)) {
        const key = k as keyof Stats;
        baseStats[key] = Math.min(150, (baseStats[key] ?? 0) + (v as number));
      }
      baseStats.wealth = Math.min(150, baseStats.wealth + clanDef.wealthBonus);
      baseStats.reputation = Math.min(150, baseStats.reputation + clanDef.startingReputation);
    }

    const logEntry = `Age 0: ${name} was born into the ${clanDef?.name || familyName} family in ${realm}.`;
    
    const startingLogs = [logEntry];
    let startingProperties: OwnedProperty[] = [];
    
    if (scenarioDef.initialProperties) {
      for (const propType of scenarioDef.initialProperties) {
        startingProperties.push({
          type: propType as PropertyType,
          category: PROPERTY_CATEGORIES[propType as PropertyType],
          acquiredAge: 0,
        });
      }
    }
    
    if (soul?.type === "reincarnation") {
      startingLogs.push(`You remember a past life... The legacy of ${soul.parentName} guides you.`);
      if (soul.inheritedProperty) {
        startingProperties.push(soul.inheritedProperty);
        startingLogs.push(`A mysterious heirloom was passed down to you: ${soul.inheritedProperty.type}.`);
      }
      if (soul.inheritedRivals && soul.inheritedRivals.length > 0) {
        startingLogs.push(`The grudges of your past life have followed you. ${soul.inheritedRivals.join(", ")} will remember you.`);
      }
    }

    const newState: GameState = {
      isAlive: true, name, gender, realm, bloodline,
      age: 0,
      stats: baseStats,
      traits: isBossMode ? ["Gifted", "Immortal Seeker"] : [],
      eventLog: startingLogs,
      achievements: isBossMode ? ["born_of_legend"] : [],
      dnaSeed: Math.random(),
      legacyScore: tempLegacy,
      properties: startingProperties,
      delayedEvents: [],
      triggeredEvents: [],
      romanceLevel,
      mysticalPath: options?.bossMysticalPath ?? (soul ? soul.mysticalPath : "none"),
      mysticalTier: soul ? soul.mysticalTier : (isBossMode && options?.bossMysticalPath && options.bossMysticalPath !== "none" ? 3 : 0),
      mysticalExp: 0,
      actionsThisYear: 0,
      partners: [],
      children: [],
      inheritedSoul: soul ?? undefined,
      generation: soul ? soul.generation : 1,
      talent,
      familyName,
      familyMembers,
      outfitStyle,
      accessory,
      appearance: options?.appearance,
      exploredLocations: [],
      visitedRealms: [],
      isBossMode,
      cosmicTier: cosmicTierDef.tier,
      familyRank: familyRankDef.rank,
      clan: chosenClan,
      scenario: scenarioDef.id,
      activeJob: undefined,
      inventory: [],
      titles: [],
      abilities: [],
      cutscene: undefined,
    };

    if (soul && soul.inheritedRivals && soul.inheritedRivals.length > 0) {
      setWorldState(prev => ({
        ...prev,
        playerRivals: soul.inheritedRivals || [],
      }));
    } else {
      setWorldState(prev => ({
        ...prev,
        playerRivals: [],
      }));
    }

    setState(newState);
    setCurrentEvent(null);
    setPendingSoul(null);
  };

  const continueAsChild = (childIdx: number) => {
    if (!state || state.isAlive) return;
    const child = state.children[childIdx];
    if (!child) return;

    const inheritedSoul: InheritedSoul = {
      parentName: state.name,
      generation: state.generation + 1,
      mysticalPath: state.mysticalPath,
      mysticalTier: Math.max(0, Math.floor(state.mysticalTier * 0.4)),
      legacyBonus: Math.floor(state.legacyScore * 0.25),
      statBonus: Object.fromEntries(
        (Object.keys(state.stats) as (keyof Stats)[]).map(k => [k, Math.floor(state.stats[k] * 0.12)])
      ) as Partial<Stats>,
      type: "progeny",
    };

    const inheritedProps = state.properties
      .filter(p => p.category === "Residential" || p.category === "Legendary")
      .slice(0, 3)
      .map(p => ({ ...p, acquiredAge: 0 }));

    const childStats = defaultStats(child.bloodline);
    for (const [k, v] of Object.entries(inheritedSoul.statBonus)) {
      const key = k as keyof Stats;
      childStats[key] = Math.min(100, childStats[key] + (v as number));
    }

    const childTalent: Talent = child.talent ?? "Average";
    const familyRankDef = getFamilyRank(inheritedSoul.legacyBonus, inheritedProps.length);
    const cosmicTierDef = getCosmicTier(inheritedSoul.legacyBonus);
    const familyMembers = generateFamilyMembers(child.bloodline, child.name);

    const newState: GameState = {
      isAlive: true,
      name: child.name,
      gender: child.gender,
      bloodline: child.bloodline,
      realm: state.realm,
      age: 0,
      stats: childStats,
      traits: state.traits.filter(() => Math.random() < 0.4).slice(0, 2),
      eventLog: [
        `Age 0: ${child.name} was born — heir to the legendary ${state.name}.`,
        `Bloodline: ${child.bloodline}. The legacy of generation ${state.generation} flows in your veins.`,
      ],
      achievements: [],
      dnaSeed: Math.random(),
      legacyScore: inheritedSoul.legacyBonus,
      properties: inheritedProps,
      delayedEvents: [],
      triggeredEvents: [],
      romanceLevel: state.romanceLevel,
      mysticalPath: inheritedSoul.mysticalTier > 0 ? inheritedSoul.mysticalPath : "none",
      mysticalTier: inheritedSoul.mysticalTier,
      mysticalExp: 0,
      actionsThisYear: 0,
      partners: [],
      children: [],
      inheritedSoul,
      generation: inheritedSoul.generation,
      talent: childTalent,
      familyName: state.familyName,
      familyMembers,
      outfitStyle: state.outfitStyle,
      accessory: state.accessory,
      exploredLocations: [],
      visitedRealms: [],
      isBossMode: state.isBossMode,
      cosmicTier: state.cosmicTier,
      familyRank: state.familyRank,
      clan: state.clan,
      scenario: state.scenario,
      activeJob: undefined,
      inventory: [],
      titles: [],
      abilities: [],
    };
    setState(newState);
    setCurrentEvent(null);
  };

  const reincarnate = () => {
    if (!state || state.isAlive) return;

    const soulBonus: Partial<Stats> = {};
    for (const k of Object.keys(state.stats) as (keyof Stats)[]) {
      const bonus = Math.floor(state.stats[k] * 0.15);
      if (bonus > 0) soulBonus[k] = bonus;
    }

    let inheritedProperty = undefined;
    if (state.properties.length > 0) {
      const bestProps = state.properties.filter(p => p.category === "Legendary" || p.category === "Cultivation");
      if (bestProps.length > 0) {
        inheritedProperty = bestProps[Math.floor(Math.random() * bestProps.length)];
      } else {
        inheritedProperty = state.properties[Math.floor(Math.random() * state.properties.length)];
      }
      // Reset acquired age
      inheritedProperty = { ...inheritedProperty, acquiredAge: 0 };
    }

    const soul: InheritedSoul = {
      parentName: state.name,
      generation: state.generation + 1,
      mysticalPath: state.mysticalPath,
      mysticalTier: Math.max(0, Math.floor(state.mysticalTier * 0.6)),
      legacyBonus: Math.floor(state.legacyScore * 0.12),
      statBonus: soulBonus,
      type: "reincarnation",
      inheritedProperty,
      inheritedRivals: worldState.playerRivals && worldState.playerRivals.length > 0 ? [...worldState.playerRivals] : [],
    };
    setPendingSoul(soul);
    setState(null);
    setCurrentEvent(null);
  };

  const ageUp = async () => {
    if (!state || !state.isAlive || currentEvent || isChronicling) return;

    setIsChronicling(true);
    let ns = passiveAge({ ...state, age: state.age + 1, stats: { ...state.stats }, actionsThisYear: 0 });
    const milestone = AGING_MSGS.find(m => m.minAge === ns.age);
    if (milestone) ns = addLog(ns, milestone.msg);

    // Hardcoded episode-like cutscenes for major milestones
    if (ns.age === 18) {
      ns.cutscene = {
        title: "The Coming of Age",
        text: `You have reached your 18th year in the realm of ${ns.realm}. The winds of fate gather around you. It is time to decide your approach to the world. Will you seek knowledge, power, or wealth?`,
        image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
        choices: [
          { text: "I shall pursue forbidden knowledge.", onClickId: "knowledge" },
          { text: "I will forge my path with strength and steel.", onClickId: "power" },
          { text: "Gold rules all realms. I seek wealth.", onClickId: "wealth" }
        ]
      };
    } else if (ns.age === 30) {
      ns.cutscene = {
        title: "The Crossroads of Destiny",
        text: `Three decades have passed since you took your first breath. Your bloodline (${ns.bloodline}) stirs within you, demanding greatness. A mysterious figure approaches you in a tavern, offering a strange artifact.`,
        image: "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?auto=format&fit=crop&w=800&q=80",
        choices: [
          { text: "Accept the artifact. Let destiny take the wheel.", onClickId: "accept_artifact" },
          { text: "Refuse. I make my own fate.", onClickId: "refuse_artifact" }
        ]
      };
    }

    for (const child of ns.children) {
      if (child.age === 18) ns = addLog(ns, `${child.name} came of age — your heir steps into adulthood.`);
    }

    ns = checkMysticalAdvance(ns);
    ns.legacyScore = computeLegacy(ns);
    // Update cosmic tier and family rank
    const cosmicTierDef = getCosmicTier(ns.legacyScore);
    const familyRankDef = getFamilyRank(ns.legacyScore, ns.properties.length);
    ns.cosmicTier = cosmicTierDef.tier;
    ns.familyRank = familyRankDef.rank;

    ns = checkAchievements(ns);
    ns = checkDeath(ns);

    if (!ns.isAlive) { 
      setState(ns); 
      setIsChronicling(false);
      return; 
    }

    // Advance world simulation each year
    const playerPower = (ns.stats.magic ?? 0) * 200 + (ns.stats.wealth ?? 0) * 100 + (ns.stats.reputation ?? 0) * 100 + (ns.stats.health ?? 0) * 50;
    setWorldState(prev => advanceWorldYear(prev, ns.age, playerPower));

    // Fetch dynamic story from oracle
    try {
      const res = await fetch("/api/oracle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: ns }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.text) {
          ns = addLog(ns, data.text);
        }
      } else {
        const quietMsg = QUIET_YEAR_MSGS[Math.floor(Math.random() * QUIET_YEAR_MSGS.length)];
        ns = addLog(ns, quietMsg);
      }
    } catch (err) {
      const quietMsg = QUIET_YEAR_MSGS[Math.floor(Math.random() * QUIET_YEAR_MSGS.length)];
      ns = addLog(ns, quietMsg);
    }

    // Check for delayed events first
    const pendingEventIndex = ns.delayedEvents.findIndex(e => ns.age >= e.triggerAge);
    if (pendingEventIndex >= 0) {
      const pendingEvent = ns.delayedEvents[pendingEventIndex];
      // Note: This logic assumes 'events' array is available or exported
      const events: GameEvent[] = []; // Placeholder for the actual events array
      const eventDef = events.find(e => e.id === pendingEvent.eventId);
      
      // Remove from queue
      ns.delayedEvents = [
        ...ns.delayedEvents.slice(0, pendingEventIndex),
        ...ns.delayedEvents.slice(pendingEventIndex + 1)
      ];

      if (eventDef) {
        setState(ns);
        setCurrentEvent(eventDef);
        setIsChronicling(false);
        return;
      }
    }

    const event = getRandomEvent(ns);
    if (event && Math.random() < 0.4) {
      // Lowered random event chance slightly since AI adds narrative
      setState(ns);
      setCurrentEvent(event);
    } else {
      setState(ns);
      setCurrentEvent(null);
    }
    
    setIsChronicling(false);
  };

  const makeChoice = (choiceIdx: number) => {
    if (!state || !currentEvent) return;
    const choice = currentEvent.choices[choiceIdx];

    let ns: GameState = {
      ...state,
      stats: { ...state.stats },
      properties: [...state.properties],
      partners: [...state.partners],
      children: [...state.children],
      delayedEvents: [...state.delayedEvents],
      triggeredEvents: [...state.triggeredEvents, currentEvent.id],
    };

    // Apply talent modifier to positive effects
    const rawEffects = choice.effects as Partial<Stats>;
    const talentEffects = applyTalentToEffects(rawEffects as Record<string, number>, ns.talent ?? "Average");
    ns = applyStatDelta(ns, talentEffects as Partial<Stats>);

    if (choice.unlockPath && ns.mysticalPath === "none") {
      ns = { ...ns, mysticalPath: choice.unlockPath, mysticalTier: 0, mysticalExp: 0 };
      ns = addLog(ns, `⚡ You have entered the ${choice.unlockPath.replace("_"," ")} path!`);
    }

    if (choice.mysticalExp && ns.mysticalPath !== "none") {
      ns = { ...ns, mysticalExp: (ns.mysticalExp ?? 0) + choice.mysticalExp };
    }

    if (choice.propertyGain && !ns.properties.some(p => p.type === choice.propertyGain)) {
      ns.properties = [
        ...ns.properties,
        { type:choice.propertyGain!, category:PROPERTY_CATEGORIES[choice.propertyGain!], acquiredAge:ns.age },
      ];
    }
    if (choice.propertyLoss) {
      ns.properties = ns.properties.filter(p => p.type !== choice.propertyLoss);
    }

    if (choice.itemGain && !ns.inventory.includes(choice.itemGain)) {
      ns.inventory = [...ns.inventory, choice.itemGain];
    }
    
    if (choice.titleGain && !ns.titles.includes(choice.titleGain)) {
      ns.titles = [...ns.titles, choice.titleGain];
    }

    if (choice.nextEventId) {
      ns.delayedEvents.push({
        eventId: choice.nextEventId,
        triggerAge: ns.age + (choice.nextEventDelay || 1)
      });
    }

    let logLine = `${currentEvent.narrative.slice(0,55)}... → ${choice.text}`;
    if (choice.propertyGain) logLine += ` (gained ${choice.propertyGain})`;
    if (choice.itemGain) logLine += ` (acquired ${choice.itemGain})`;
    if (choice.titleGain) logLine += ` (earned title: ${choice.titleGain})`;
    
    ns = addLog(ns, logLine);

    ns = checkMysticalAdvance(ns);
    ns.legacyScore = computeLegacy(ns);
    const cosmicTierDef = getCosmicTier(ns.legacyScore);
    const familyRankDef = getFamilyRank(ns.legacyScore, ns.properties.length);
    ns.cosmicTier = cosmicTierDef.tier;
    ns.familyRank = familyRankDef.rank;
    ns = checkAchievements(ns);
    ns = checkDeath(ns);

    setState(ns);
    setCurrentEvent(null);
  };

  const clearEvent = () => setCurrentEvent(null);

  const quitLife = () => {
    if (!state) return;
    setState({ ...state, isAlive: false, deathCause: "Chose to end this chapter and walk into the unknown." });
    setCurrentEvent(null);
  };

  const setStance = (stance: FocusStance) => {
    if (!state) return;
    setState({ ...state, activeStance: stance });
  };
  const interactPartner = (partnerId: string, action: "chat" | "gift" | "intimate" | "breakup"): { success: boolean; log: string } => {
    if (!state) return { success: false, log: "" };
    const maxActions = getMaxActionsPerYear(state);
    if (state.actionsThisYear >= maxActions) return { success: false, log: "No actions left this year." };

    const partnerIdx = state.partners.findIndex(p => p.id === partnerId);
    if (partnerIdx === -1) return { success: false, log: "Partner not found." };
    const partner = state.partners[partnerIdx];
    
    let ns = { ...state, actionsThisYear: state.actionsThisYear + 1 };
    const partners = [...ns.partners];
    let log = "";
    
    if (action === "breakup") {
      log = `You ended your relationship with ${partner.name}.`;
      partners.splice(partnerIdx, 1);
      ns.stats.happiness = clampStat(ns.stats.happiness - 10);
    } else {
      let affGain = 0;
      if (action === "chat") { affGain = 3; log = `You had a pleasant chat with ${partner.name}.`; }
      else if (action === "gift") { 
        if (ns.stats.wealth < 5) return { success: false, log: "Not enough wealth for a gift." };
        ns.stats.wealth -= 5;
        affGain = 8; 
        log = `You gave ${partner.name} a thoughtful gift.`;
      }
      else if (action === "intimate") {
        affGain = 5;
        log = ns.romanceLevel === "explicit" ? `You shared a passionate night with ${partner.name}.` : `You spent an intimate evening with ${partner.name}.`;
        ns.stats.happiness = clampStat(ns.stats.happiness + 5);
      }
      
      partners[partnerIdx] = { ...partner, affection: Math.min(100, partner.affection + affGain) };
    }
    
    ns.partners = partners;
    ns.eventLog = [...ns.eventLog, log];
    setState(ns);
    return { success: true, log };
  };

  const interactFamily = (familyId: string, action: "chat" | "gift" | "argue"): { success: boolean; log: string } => {
    if (!state) return { success: false, log: "" };
    const maxActions = getMaxActionsPerYear(state);
    if (state.actionsThisYear >= maxActions) return { success: false, log: "No actions left this year." };

    const familyIdx = state.familyMembers.findIndex(f => f.id === familyId);
    if (familyIdx === -1) return { success: false, log: "Family member not found." };
    const family = state.familyMembers[familyIdx];
    
    if (!family.alive) return { success: false, log: "They are no longer with us." };

    let ns = { ...state, actionsThisYear: state.actionsThisYear + 1 };
    const members = [...ns.familyMembers];
    let log = "";
    let affGain = 0;
    
    if (action === "chat") { affGain = 3; log = `You spent quality time with your ${family.relation}, ${family.name}.`; }
    else if (action === "gift") {
      if (ns.stats.wealth < 5) return { success: false, log: "Not enough wealth for a gift." };
      ns.stats.wealth -= 5;
      affGain = 8;
      log = `You gave a gift to ${family.name}.`;
    }
    else if (action === "argue") {
      affGain = -15;
      log = `You had a bitter argument with ${family.name}.`;
      ns.stats.happiness = clampStat(ns.stats.happiness - 5);
    }
    
    members[familyIdx] = { ...family, affection: Math.max(0, Math.min(100, (family.affection || 50) + affGain)) };
    
    ns.familyMembers = members;
    ns.eventLog = [...ns.eventLog, log];
    setState(ns);
    return { success: true, log };
  };
  const doActivity = (key: string): { success:boolean; log:string } => {
    if (!state) return { success:false, log:"" };
    const activity = ACTIVITIES.find(a => a.key === key);
    if (!activity) return { success:false, log:"Unknown activity." };

    if (activity.minAge && state.age < activity.minAge)
      return { success:false, log:`Too young — minimum age is ${activity.minAge}.` };
    if (activity.reqStat && state.stats[activity.reqStat.key] < activity.reqStat.min)
      return { success:false, log:`Need ${activity.reqStat.key} ≥ ${activity.reqStat.min}.` };
    if (activity.cost && state.stats.wealth < activity.cost)
      return { success:false, log:"Cannot afford this right now." };
    if (activity.reqPath && state.mysticalPath !== activity.reqPath)
      return { success:false, log:`Requires the ${activity.reqPath.replace("_"," ")} path.` };
    if (activity.reqPartner && state.partners.length === 0)
      return { success:false, log:"You need a partner for this. Find love first." };
    if (state.romanceLevel === "none" && (activity.key === "intimate" || activity.key === "take_consort"))
      return { success:false, log:"This isn't your path — you chose a life of ambition over romance." };

    const maxActions = getMaxActionsPerYear(state);
    if ((state.actionsThisYear ?? 0) >= maxActions)
      return { success:false, log:`No actions left this year (${maxActions} used). Age up to continue.` };

    const talentDef = TALENTS[state.talent ?? "Average"];
    const baseRisk = activity.riskChance ?? 0;
    const adjustedRisk = Math.max(0, baseRisk - talentDef.successBonus);
    const failed = adjustedRisk > 0 && Math.random() < adjustedRisk;

    let ns: GameState = {
      ...state,
      stats: { ...state.stats },
      properties: [...state.properties],
      partners: [...state.partners],
      children: [...state.children],
      actionsThisYear: (state.actionsThisYear ?? 0) + 1,
    };

    if (activity.cost) ns.stats.wealth = clampStat(ns.stats.wealth - activity.cost);

    const rawEffects = failed ? (activity.failEffects ?? {}) : activity.effects;
    const effects = failed
      ? rawEffects
      : applyTalentToEffects(rawEffects as Record<string, number>, ns.talent ?? "Average");

    const useExplicit = !failed && state.romanceLevel === "explicit" && activity.logExplicit;
    const logEntry = failed
      ? (activity.failLog ?? activity.log)
      : (useExplicit ? activity.logExplicit! : activity.log);

    ns = applyStatDelta(ns, effects as Partial<Stats>);

    if (!failed) {
      if (activity.cultivatorExp && ns.mysticalPath === "cultivation") {
        ns = { ...ns, mysticalExp: (ns.mysticalExp ?? 0) + activity.cultivatorExp };
      }
      if (activity.mysticalExp && ns.mysticalPath !== "none") {
        ns = { ...ns, mysticalExp: (ns.mysticalExp ?? 0) + activity.mysticalExp };
      }

      if (activity.addsPartner && ns.partners.length < 8) {
        const partnerGender: Gender = ns.gender === "Male" ? "Female" : ns.gender === "Female" ? "Male" : (Math.random() < 0.5 ? "Male" : "Female");
        const partnerName = randomName(partnerGender);
        const pTraits = ["Loyal", "Ambitious", "Kind", "Deceitful", "Jealous", "Brave", "Charming", "Shy"];
        if (!ns.partners.some(p => p.name === partnerName)) {
          ns.partners = [...ns.partners, {
            id: crypto.randomUUID(),
            name: partnerName,
            gender: partnerGender,
            affection: activity.addsPartner === "consort" ? 75 : 65,
            role: activity.addsPartner,
            age: 16 + Math.floor(Math.random() * 20),
            trait: pTraits[Math.floor(Math.random() * pTraits.length)]
          }];
        }
      }

      if (activity.upgradesPartner && ns.partners.length > 0) {
        const targetRole: PartnerRole = activity.upgradesPartner === "spouse" ? "lover" : "consort";
        const idx = ns.partners.findIndex(p => p.role === targetRole || p.role === "lover");
        if (idx >= 0) {
          ns.partners = ns.partners.map((p, i) =>
            i === idx ? { ...p, role: activity.upgradesPartner!, affection: Math.min(100, p.affection + 20) } : p
          );
        }
      }

      if (activity.key === "intimate" && ns.partners.length > 0) {
        ns.partners = ns.partners.map((p, i) =>
          i === 0 ? { ...p, affection: Math.min(100, p.affection + 15) } : p
        );
      }

      if (activity.key === "divorce" && ns.partners.length > 0) {
        const spouseIdx = ns.partners.findIndex(p => p.role === "spouse");
        if (spouseIdx >= 0) ns.partners = ns.partners.filter((_, i) => i !== spouseIdx);
        else ns.partners = ns.partners.slice(1);
      }

      if (activity.addsChild) {
        const cGender = randomChildGender();
        const cName = randomChildName(cGender);
        if (!ns.children.some(c => c.name === cName)) {
          const childTalent: Talent = Math.random() < 0.1 ? "Genius" : Math.random() < 0.2 ? "Talented" : Math.random() < 0.7 ? "Average" : Math.random() < 0.5 ? "Slow" : "Dull";
          ns.children = [...ns.children, { name: cName, gender: cGender, age: 0, bloodline: ns.bloodline, talent: childTalent }];
        }
      }
    }

    if (!failed && activity.propertyGain && !ns.properties.some(p => p.type === activity.propertyGain)) {
      ns.properties = [
        ...ns.properties,
        { type:activity.propertyGain!, category:PROPERTY_CATEGORIES[activity.propertyGain!], acquiredAge:ns.age },
      ];
    }

    ns = addLog(ns, logEntry);
    ns = checkMysticalAdvance(ns);
    ns.legacyScore = computeLegacy(ns);
    const cosmicTierDef = getCosmicTier(ns.legacyScore);
    const familyRankDef = getFamilyRank(ns.legacyScore, ns.properties.length);
    ns.cosmicTier = cosmicTierDef.tier;
    ns.familyRank = familyRankDef.rank;
    ns = checkAchievements(ns);
    ns = checkDeath(ns);
    setState(ns);

    return { success:!failed, log:logEntry };
  };

  const doExplore = (locationId: string): { success: boolean; log: string } => {
    if (!state) return { success: false, log: "" };

    const maxActions = getMaxActionsPerYear(state);
    if ((state.actionsThisYear ?? 0) >= maxActions)
      return { success: false, log: `No actions left this year. Age up to continue.` };

    const locations = getLocationsForRealm(state.realm);
    const location = locations.find(l => l.id === locationId);
    if (!location) return { success: false, log: "Unknown location." };

    if (location.minStat && state.stats[location.minStat.key] < location.minStat.min)
      return { success: false, log: `Need ${location.minStat.key} ≥ ${location.minStat.min} to explore ${location.name}.` };

    if (location.reqPath && state.mysticalPath !== location.reqPath)
      return { success: false, log: `Requires the ${location.reqPath.replace("_", " ")} path.` };

    const talentDef = TALENTS[state.talent ?? "Average"];
    let ns: GameState = {
      ...state,
      stats: { ...state.stats },
      actionsThisYear: (state.actionsThisYear ?? 0) + 1,
    };

    const failed = location.danger && Math.random() < (0.3 - talentDef.successBonus * 0.5);
    if (failed) {
      ns = applyStatDelta(ns, { health: -15 });
      const failLog = `tried to explore ${location.name} but encountered deadly opposition — barely escaped alive`;
      ns = addLog(ns, failLog);
      ns.legacyScore = computeLegacy(ns);
      ns = checkDeath(ns);
      setState(ns);
      return { success: false, log: failLog };
    }

    const effects = applyTalentToEffects(location.effects as Record<string, number>, ns.talent ?? "Average");
    ns = applyStatDelta(ns, effects as Partial<Stats>);

    if (location.mysticalExp && ns.mysticalPath !== "none") {
      ns = { ...ns, mysticalExp: (ns.mysticalExp ?? 0) + location.mysticalExp };
    }
    if (location.cultivatorExp && ns.mysticalPath === "cultivation") {
      ns = { ...ns, mysticalExp: (ns.mysticalExp ?? 0) + location.cultivatorExp };
    }

    if (!ns.exploredLocations.includes(locationId)) {
      ns = { ...ns, exploredLocations: [...ns.exploredLocations, locationId] };
    }

    if (location.itemGain && !ns.inventory.includes(location.itemGain)) {
      ns.inventory = [...ns.inventory, location.itemGain];
    }
    
    if (location.titleGain && !ns.titles.includes(location.titleGain)) {
      ns.titles = [...ns.titles, location.titleGain];
    }

    let logEntry = `explored ${location.name} and ${location.log}`;
    if (location.itemGain) logEntry += ` (found ${location.itemGain})`;
    if (location.titleGain) logEntry += ` (known as ${location.titleGain})`;

    ns = addLog(ns, logEntry);
    ns = checkMysticalAdvance(ns);
    ns.legacyScore = computeLegacy(ns);
    const cosmicTierDef = getCosmicTier(ns.legacyScore);
    const familyRankDef = getFamilyRank(ns.legacyScore, ns.properties.length);
    ns.cosmicTier = cosmicTierDef.tier;
    ns.familyRank = familyRankDef.rank;
    ns = checkAchievements(ns);
    ns = checkDeath(ns);
    setState(ns);

    return { success: true, log: logEntry };
  };

  const doJob = (jobId: string): { success:boolean; log:string } => {
    if (!state) return { success:false, log:"" };
    const job = JOBS.find(j => j.id === jobId);
    if (!job) return { success:false, log:"Unknown job." };

    if (job.minAge && state.age < job.minAge)
      return { success:false, log:`Too young — minimum age is ${job.minAge}.` };
    if (job.reqStats) {
      for (const [k, v] of Object.entries(job.reqStats)) {
        if ((state.stats[k as keyof Stats] ?? 0) < v)
          return { success:false, log:`Need ${k} ≥ ${v}.` };
      }
    }
    if (job.mysticalPath && state.mysticalPath !== job.mysticalPath)
      return { success:false, log:`Requires the ${job.mysticalPath.replace("_"," ")} path.` };

    const maxActions = getMaxActionsPerYear(state);
    if ((state.actionsThisYear ?? 0) >= maxActions)
      return { success:false, log:`No actions left this year. Age up to continue.` };

    const income = getJobIncome(job, state.stats, state.talent ?? "Average");

    let ns: GameState = {
      ...state,
      stats: { ...state.stats },
      actionsThisYear: (state.actionsThisYear ?? 0) + 1,
      activeJob: job.id,
    };

    ns.stats.wealth = Math.min(999, ns.stats.wealth + income);
    if (job.statGain) {
      for (const [k, v] of Object.entries(job.statGain)) {
        const key = k as keyof Stats;
        ns.stats[key] = Math.min(999, (ns.stats[key] ?? 0) + (v as number));
      }
    }
    ns.stats.career = Math.min(999, ns.stats.career + 2);

    // Meaningful trade-off: Working hard stunts magic growth and relationships
    if (ns.stats.magic && ns.stats.magic > 0) {
      ns.stats.magic = Math.max(0, ns.stats.magic - 1);
    }
    ns.stats.relationships = Math.max(0, (ns.stats.relationships ?? 0) - 1);
    ns.stats.happiness = Math.max(0, (ns.stats.happiness ?? 0) - 1);

    const logEntry = `Worked as ${job.title} — earned ${income} gold.`;
    ns = addLog(ns, logEntry);
    ns.legacyScore = computeLegacy(ns);
    const cosmicTierDef = getCosmicTier(ns.legacyScore);
    const familyRankDef = getFamilyRank(ns.legacyScore, ns.properties.length);
    ns.cosmicTier = cosmicTierDef.tier;
    ns.familyRank = familyRankDef.rank;
    ns = checkAchievements(ns);
    setState(ns);

    return { success:true, log:logEntry };
  };

  const doTravel = (targetRealm: Realm): { success:boolean; log:string } => {
    if (!state) return { success:false, log:"" };

    if (state.realm === targetRealm)
      return { success:false, log:"You are already in this realm." };

    if (state.age < 18 && !state.isBossMode) {
      return { success: false, log: "You must be at least 18 years old to brave the void between realms." };
    }

    let wealthCost = 0;
    if (!state.isBossMode) {
      const realmRequirements: Partial<Record<Realm, { magic?: number; wealth?: number; reputation?: number }>> = {
        "Aethoria": { wealth: 50 },
        "Celestia": { magic: 50, wealth: 100 },
        "Shadowmere": { magic: 80, reputation: 50 },
        "Infernus": { magic: 100, wealth: 200 },
        "Sylvara": { reputation: 80, wealth: 150 },
        "Tidehaven": { wealth: 300 },
        "Voidmere": { magic: 120, reputation: 100 },
        "Arcanum": { magic: 100, wealth: 50 },
        "Ironhold": { wealth: 80, reputation: 30 },
      };

      const reqs = realmRequirements[targetRealm];
      if (reqs) {
        if (reqs.magic && (state.stats.magic ?? 0) < reqs.magic)
          return { success: false, log: `Travel to ${targetRealm} requires ${reqs.magic} Magic to survive the void.` };
        if (reqs.wealth && (state.stats.wealth ?? 0) < reqs.wealth)
          return { success: false, log: `Passage to ${targetRealm} requires ${reqs.wealth} Wealth.` };
        if (reqs.reputation && (state.stats.reputation ?? 0) < reqs.reputation)
          return { success: false, log: `The gates of ${targetRealm} demand at least ${reqs.reputation} Reputation.` };
        wealthCost = reqs.wealth ?? 0;
      }
    }

    const maxActions = getMaxActionsPerYear(state);
    if ((state.actionsThisYear ?? 0) >= maxActions)
      return { success:false, log:"No actions left this year. Age up to continue." };

    const previousRealm = state.realm;
    const visited = (state.visitedRealms ?? []);
    const alreadyVisited = visited.includes(targetRealm);

    let ns: GameState = {
      ...state,
      stats: { ...state.stats },
      actionsThisYear: (state.actionsThisYear ?? 0) + 1,
      realm: targetRealm,
      exploredLocations: [],
      visitedRealms: alreadyVisited ? visited : [...visited, previousRealm],
    };

    ns.stats.wealth = Math.max(0, ns.stats.wealth - wealthCost);
    ns = applyStatDelta(ns, { health: -10, luck: 2, magic: 2 });

    const logEntry = wealthCost > 0 
      ? `journeyed from ${previousRealm} to ${targetRealm} (Paid ${wealthCost} wealth for passage)`
      : `journeyed from ${previousRealm} to ${targetRealm}`;
    
    ns = addLog(ns, logEntry);
    ns.legacyScore = computeLegacy(ns);
    ns = checkAchievements(ns);
    ns = checkDeath(ns);
    setState(ns);

    return { success:true, log:logEntry };
  };

  const resolveCutscene = (onClickId: string) => {
    if (!state) return;
    let ns: GameState = { ...state, cutscene: undefined };
    
    switch (onClickId) {
      case "knowledge":
        ns = applyStatDelta(ns, { intelligence: 15, magic: 10, health: -5 });
        ns = addLog(ns, "You dedicated your life to forbidden knowledge. Intelligence and Magic increased, but your Health suffered.");
        break;
      case "power":
        ns = applyStatDelta(ns, { strength: 20, health: 10, relationships: -10 });
        ns = addLog(ns, "You forged a path of strength. Strength and Health increased, but your relationships withered.");
        break;
      case "wealth":
        ns = applyStatDelta(ns, { wealth: 25, charisma: 10, reputation: -5 });
        ns = addLog(ns, "You pursued gold above all else. Wealth and Charisma increased, but your reputation is tainted with greed.");
        break;
      case "accept_artifact":
        ns = applyStatDelta(ns, { magic: 25, luck: -15, infamy: 15 });
        ns.abilities = [...(ns.abilities || []), "Void Touch"];
        ns = addLog(ns, "You accepted the strange artifact. Dark magic surges through you. You gained the 'Void Touch' ability, but your luck has plummeted.");
        break;
      case "refuse_artifact":
        ns = applyStatDelta(ns, { luck: 15, faith: 15 });
        ns = addLog(ns, "You refused the artifact, choosing to forge your own path. Your Faith and Luck increased.");
        break;
      default:
        ns = addLog(ns, `You made a choice: ${onClickId}`);
        break;
    }
    
    ns.legacyScore = computeLegacy(ns);
    setState(ns);
  };

  return (
    <GameContext.Provider value={{
      state, currentEvent, worldState, pendingSoul, isChronicling,
      startNewGame, makeChoice, ageUp, doActivity, doExplore, doJob, doTravel, clearEvent, quitLife, setStance,
      continueAsChild, reincarnate, loadGameState, interactPartner, interactFamily, resolveCutscene,
      clearPendingSoul: () => setPendingSoul(null),
    }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
};
