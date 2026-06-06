import { useState, useEffect, useRef } from "react";
import { useRouter } from "../App";
import { useGame, ACTIVITIES, Activity, getMysticalTitle, getMaxActionsPerYear } from "@/lib/games/life-chronicle/engine/GameContext";
import { CULTIVATOR_RANKS, RANK_EXP_THRESHOLDS } from "@/lib/games/life-chronicle/engine/cultivator";
import SaveManager from "@/components/games/life-chronicle/SaveManager";
import { getSpriteSvg } from "@/lib/games/life-chronicle/engine/sprite";
import { motion, AnimatePresence } from "framer-motion";
import {
  PropertyCategory, MYSTICAL_PATH_ICONS, MYSTICAL_PATH_NAMES,
  PATH_CURRENCY_NAMES, PATH_CURRENCY_ICONS, PartnerRole, Realm, FocusStance,
} from "@/lib/games/life-chronicle/engine/types";
import { getRealmTheme, REALM_THEMES } from "@/lib/games/life-chronicle/engine/realmThemes";
import AiGuide from "../AiGuide";
import NpcChat from "../NpcChat";
import { WORLD_NPCS, CATEGORY_BORDER } from "@/lib/games/life-chronicle/engine/npcLeaderboard";
import { getLocationsForRealm } from "@/lib/games/life-chronicle/engine/realmMap";
import { TALENTS } from "@/lib/games/life-chronicle/engine/talents";
import { getClanByName, CLAN_TIERS } from "@/lib/games/life-chronicle/engine/clanSystem";
import { JOBS, getAvailableJobs, JOB_TIER_COLORS } from "@/lib/games/life-chronicle/engine/jobSystem";
import { CutsceneOverlay } from "@/components/games/life-chronicle/ui/CutsceneOverlay";

type NavTab = "life" | "job" | "assets" | "bonds" | "activities" | "map" | "world";

const STAT_BAR_KEYS  = ["health", "happiness", "relationships", "wealth"] as const;
const STAT_BAR_ICONS: Record<string, string> = {
  health: "♥", happiness: "☺", relationships: "✿", wealth: "◈",
};

const ALL_STATS = [
  "health","happiness","relationships","education","career","wealth",
  "charisma","intelligence","strength","magic","reputation","faith","infamy","luck"
] as const;
const STAT_COLORS_FULL: Record<string, string> = {
  health: "bg-red-500", happiness: "bg-amber-400", relationships: "bg-pink-500",
  education: "bg-blue-400", career: "bg-cyan-400", wealth: "bg-emerald-500",
  charisma: "bg-purple-400", intelligence: "bg-indigo-400", strength: "bg-orange-400",
  magic: "bg-violet-500", reputation: "bg-teal-400", faith: "bg-sky-300",
  infamy: "bg-rose-600", luck: "bg-lime-400",
};
const STAT_BAR_COLORS: Record<string, string> = {
  health: "bg-red-500", happiness: "bg-amber-400",
  relationships: "bg-pink-500", wealth: "bg-emerald-500",
};

const CAREER_TITLES: Record<string, string[]> = {
  Common:    ["Peasant","Laborer","Craftsman","Merchant","Noble","Baron","Count","Duke","King","Emperor"],
  Draconic:  ["Hatchling","Wyrm-Blood","Scale-Knight","Dragon Guard","Dragon Lord","Dragon Emperor"],
  Elven:     ["Sapling","Forest Ward","Elven Scout","Elven Mage","High Elf","Elder Sage"],
  Infernal:  ["Imp-Kin","Fiend","Infernal Knight","Hell Baron","Archdevil","Dark Lord"],
  Celestial: ["Acolyte","Radiant","Blessed One","Saint","Archangel","Divine"],
  Fae:       ["Changeling","Sprite","Fae Knight","Fae Noble","Fae Monarch","Unseelie King"],
  Werewolf:  ["Cub","Pup","Pack Member","Beta","Alpha","Pack Lord"],
  Undead:    ["Revenant","Ghoul","Wight","Vampire","Lich","Death Lord"],
  Void:      ["Hollow","Shade","Void Walker","Void Knight","Void Sovereign","End"],
  Dwarvish:  ["Miner","Apprentice","Artisan","Master Smith","Clan Chief","High King"],
  Orcish:    ["Grunt","Warrior","Berserker","Warchief","Overlord","Warlord"],
  Merfolk:   ["Fingerling","Tide-swimmer","Coral Guard","Sea Knight","Tide Lord","Ocean Sovereign"],
};
function getCareerTitle(bloodline: string, career: number) {
  const t = CAREER_TITLES[bloodline] ?? CAREER_TITLES.Common;
  return t[Math.min(Math.floor((career / 100) * t.length), t.length - 1)];
}

function formatWealth(w: number) {
  const totalCopper = Math.round(w * 847 + w * w * 30);
  const gold   = Math.floor(totalCopper / 100);
  const silver = Math.floor((totalCopper % 100) / 10);
  if (gold >= 1_000_000) return `${(gold / 1_000_000).toFixed(1)}M 🥇`;
  if (gold >= 1_000)     return `${(gold / 1000).toFixed(1)}k 🥇`;
  if (gold > 0)          return `${gold} 🥇 ${silver} 🥈`;
  return `${silver} 🥈`;
}

const PROP_CAT_ICONS: Record<PropertyCategory, string> = {
  Residential:"⌂", Commercial:"⊞", Agricultural:"⊙",
  Magical:"✦", Territory:"⊿", Legendary:"✵", Cultivation:"⚡",
};

const BASE_ACT_CATS = [
  { key: "crime",     label: "Crime",       icon: "🗡" },
  { key: "love",      label: "Love",        icon: "❤" },
  { key: "mind",      label: "Mind & Body", icon: "💪" },
  { key: "health",    label: "Health",      icon: "⚕" },
  { key: "lifestyle", label: "Lifestyle",   icon: "🌴" },
  { key: "legal",     label: "Legal",       icon: "⚖" },
] as const;

const PATH_ACT_CATS: Record<string, { key: Activity["category"]; label: string; icon: string }[]> = {
  cultivation: [{ key: "cultivation", label: "Cultivate", icon: "⚡" }],
  arcane_magic: [{ key: "arcane",     label: "Arcane",    icon: "✦" }],
  sacred_arts:  [{ key: "sacred",     label: "Sacred",    icon: "✵" }],
  rune_smith:   [{ key: "rune",       label: "Runes",     icon: "⬡" }],
};

const MYSTICAL_PATH_COLORS: Record<string, string> = {
  cultivation: "#f0a830",
  arcane_magic: "#8080ff",
  sacred_arts: "#f0d040",
  rune_smith: "#50d0c0",
};

const RARITY_COLOR: Record<string, string> = {
  common:     "#8898a8",
  uncommon:   "#50d080",
  rare:       "#8080f0",
  legendary:  "#ffd700",
};

function parseAge(entry: string): number | null {
  const m = entry.match(/^Age (\d+):/);
  return m ? parseInt(m[1], 10) : null;
}
function stripAge(entry: string) { return entry.replace(/^Age \d+: /, ""); }

interface AgeGroup { age: number; entries: string[] }
function groupByAge(log: string[]): AgeGroup[] {
  const groups: AgeGroup[] = [];
  for (const entry of log) {
    const age = parseAge(entry);
    if (age === null) continue;
    const last = groups[groups.length - 1];
    if (last && last.age === age) {
      last.entries.push(stripAge(entry));
    } else {
      groups.push({ age, entries: [stripAge(entry)] });
    }
  }
  return groups;
}

function RealmParticles({ theme }: { theme: ReturnType<typeof getRealmTheme> }) {
  const particles = theme.particles;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(8)].map((_, i) => (
        <motion.div key={i} className="absolute text-xs select-none"
          style={{ color: theme.particleColor, opacity: 0.15, left: `${(i * 13 + 7) % 100}%` }}
          animate={{
            y: ["-10px", `${80 + i * 40}px`],
            opacity: [0, 0.2, 0.15, 0],
            x: [0, (i % 2 === 0 ? 12 : -12)],
          }}
          transition={{ duration: 6 + i * 1.5, repeat: Infinity, delay: i * 0.8, ease: "easeInOut" }}>
          {particles[i % particles.length]}
        </motion.div>
      ))}
    </div>
  );
}

export default function Game() {
  const { navigate } = useRouter();
  const { state, currentEvent, worldState, isChronicling, makeChoice, ageUp, doActivity, doExplore, doJob, doTravel, clearEvent, quitLife, setStance, interactPartner, interactFamily, resolveCutscene } = useGame();

  const [tab, setTab]                         = useState<NavTab>("life");
  const [actCat, setActCat]                   = useState<Activity["category"]>("crime");
  const [showModal, setShowModal]             = useState(false);
  const [showQuitModal, setShowQuitModal]     = useState(false);
  const [showSaves, setShowSaves]             = useState(false);
  const [actFeedback, setActFeedback]         = useState<{ msg: string; ok: boolean } | null>(null);
  const [ageFlash, setAgeFlash]               = useState(false);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const [statDeltas, setStatDeltas]           = useState<Record<string, number>>({});
  const [chatNpc, setChatNpc]                 = useState<(typeof WORLD_NPCS)[0] | null>(null);
  const [jobTierFilter, setJobTierFilter]     = useState<string>("all");
  const [travelTarget, setTravelTarget]       = useState<Realm | null>(null);
  const [savedPulse, setSavedPulse]           = useState(false);
  const prevAchievements = useRef<string[]>([]);
  const prevStats        = useRef<Record<string, number>>({});
  const logEndRef        = useRef<HTMLDivElement>(null);
  const prevAge          = useRef<number | null>(null);

  useEffect(() => {
    if (!state) { navigate("home"); return; }
    if (!state.isAlive) { navigate("death"); return; }
  }, [state, navigate]);

  useEffect(() => {
    if (!state) return;
    const currentAge = state.age;
    if (prevAge.current !== null && prevAge.current !== currentAge) {
      setSavedPulse(true);
      prevAge.current = currentAge;
      const t = setTimeout(() => setSavedPulse(false), 2000);
      return () => clearTimeout(t);
    }
    prevAge.current = currentAge;
    return undefined;
  }, [state?.age]);

  useEffect(() => {
    if (currentEvent) { setShowModal(true); setTab("life"); }
  }, [currentEvent]);

  useEffect(() => {
    if (tab === "life") {
      requestAnimationFrame(() =>
        logEndRef.current?.scrollIntoView({ behavior: "smooth" })
      );
    }
  }, [state?.eventLog.length, tab]);

  useEffect(() => {
    if (!state) return;
    const prev = prevAchievements.current;
    const newOnes = state.achievements.filter(a => !prev.includes(a));
    if (newOnes.length) {
      setNewAchievements(newOnes);
      setTimeout(() => setNewAchievements([]), 5000);
    }
    prevAchievements.current = state.achievements;
  }, [state?.achievements]);

  useEffect(() => {
    if (!state) return;
    const deltas: Record<string, number> = {};
    for (const [k, v] of Object.entries(state.stats)) {
      const prev = prevStats.current[k] ?? v;
      const delta = (v as number) - prev;
      if (delta !== 0) deltas[k] = delta;
    }
    if (Object.keys(deltas).length > 0) {
      setStatDeltas(deltas);
      setTimeout(() => setStatDeltas({}), 2000);
    }
    prevStats.current = { ...state.stats };
  }, [state?.stats]);

  if (!state || !state.isAlive) return null;

  const theme = getRealmTheme(state.realm);
  const canAge      = !currentEvent && !isChronicling;
  const careerTitle = getCareerTitle(state.bloodline, state.stats.career);
  const phase =
    state.age < 3 ? "Infant" : state.age < 13 ? "Child" :
    state.age < 18 ? "Teen"  : state.age < 30 ? "Young Adult" :
    state.age < 55 ? "Adult" : state.age < 70 ? "Middle Age" :
    state.age < 90 ? "Elder" : "Ancient";

  const logGroups = groupByAge(state.eventLog);

  const propsByCategory = state.properties.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<PropertyCategory, typeof state.properties>);

  const hasMysticalPath = state.mysticalPath !== "none";
  const mysticalColor   = MYSTICAL_PATH_COLORS[state.mysticalPath] ?? theme.accent;
  const mysticalTitle   = hasMysticalPath ? getMysticalTitle(state.mysticalPath, state.mysticalTier) : null;
  const mysticalIcon    = MYSTICAL_PATH_ICONS[state.mysticalPath];

  const actCats: { key: Activity["category"]; label: string; icon: string }[] = [
    ...BASE_ACT_CATS,
    ...(hasMysticalPath ? (PATH_ACT_CATS[state.mysticalPath] ?? []) : []),
  ];

  const mysticalExpThreshold = hasMysticalPath 
    ? (state.mysticalPath === "cultivation" 
        ? RANK_EXP_THRESHOLDS[CULTIVATOR_RANKS[state.mysticalTier] || "Mortal Awakening"]
        : 100 + state.mysticalTier * 80)
    : 100;
  const mysticalExpPct = hasMysticalPath ? Math.min(100, ((state.mysticalExp ?? 0) / mysticalExpThreshold) * 100) : 0;

  const maxActions    = getMaxActionsPerYear(state);
  const actionsLeft   = Math.max(0, maxActions - (state.actionsThisYear ?? 0));
  const actionsUsed   = state.actionsThisYear ?? 0;

  const topLegends = [...WORLD_NPCS]
    .filter(n => worldState.npcAlive[n.name] !== false)
    .map(n => ({ ...n, livepower: worldState.npcPowers[n.name] ?? n.power }))
    .sort((a, b) => b.livepower - a.livepower)
    .slice(0, 8);

  const realmLocations = getLocationsForRealm(state.realm);
  const talentDef = TALENTS[state.talent ?? "Average"];

  const handleAgeUp = async () => {
    if (!canAge) return;
    setAgeFlash(true);
    setTimeout(() => setAgeFlash(false), 400);
    await ageUp();
  };

  const handleActivity = (key: string) => {
    const result = doActivity(key);
    setActFeedback({ msg: result.log, ok: result.success });
    setTimeout(() => setActFeedback(null), 3500);
  };

  const handleInteractPartner = (partnerId: string, action: "chat" | "gift" | "intimate" | "breakup") => {
    const result = interactPartner(partnerId, action);
    setActFeedback({ msg: result.log, ok: result.success });
    setTimeout(() => setActFeedback(null), 3500);
  };

  const handleInteractFamily = (familyId: string, action: "chat" | "gift" | "argue") => {
    const result = interactFamily(familyId, action);
    setActFeedback({ msg: result.log, ok: result.success });
    setTimeout(() => setActFeedback(null), 3500);
  };

  const handleJob = (jobId: string) => {
    const result = doJob(jobId);
    setActFeedback({ msg: result.log, ok: result.success });
    setTimeout(() => setActFeedback(null), 3500);
  };

  const activeClan = state.clan ? getClanByName(state.clan) : undefined;
  const clanTierDef = activeClan ? CLAN_TIERS[activeClan.tier] : null;
  const availableJobs = getAvailableJobs(state.age, state.stats, state.bloodline, state.mysticalPath);

  const handleExplore = (locationId: string) => {
    const result = doExplore(locationId);
    setActFeedback({ msg: result.log, ok: result.success });
    setTimeout(() => setActFeedback(null), 3500);
    setTab("map");
  };

  const handleTravel = (realm: Realm) => {
    const result = doTravel(realm);
    setActFeedback({ msg: result.log, ok: result.success });
    setTimeout(() => setActFeedback(null), 3500);
    setTravelTarget(null);
    if (result.success) setTab("map");
  };

  const visibleActivities = ACTIVITIES.filter(a => {
    if (a.category !== actCat) return false;
    if (a.reqPath && state.mysticalPath !== a.reqPath) return false;
    return true;
  });

  const handleChoice = (idx: number) => {
    makeChoice(idx);
    setShowModal(false);
  };

  const handleQuitLife = () => {
    quitLife();
    setShowQuitModal(false);
  };

  return (
    <div className="game-wrapper flex items-start justify-center relative h-full">
      <div className="w-full max-w-4xl h-full flex flex-col relative z-10 bg-transparent text-on-surface dark:text-white shadow-2xl shadow-black/20 transition-colors duration-300">

        {/* ─── UNIVERSAL TOP BAR ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between p-3 shrink-0">
          <div className="block-panel-light px-3 py-1 flex items-center gap-2 text-sm font-bold shadow-none border-[2px]">
            <span>⚡</span> Actions {actionsUsed}/{maxActions}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowSaves(true)} className="block-btn bg-[#FFD166] px-2 py-1 text-lg shadow-none border-[2px]">
              💎
            </button>
            <button onClick={() => setShowQuitModal(true)} className="block-btn bg-[#3E85E4] px-2 py-1 text-lg shadow-none border-[2px]">
              ⚙️
            </button>
          </div>
        </div>

        {/* ─── ACHIEVEMENT TOAST ──────────────────────────────── */}
        <AnimatePresence>
          {newAchievements.length > 0 && (
            <motion.div
              className="absolute top-16 left-0 right-0 z-40 mx-4 px-4 py-3 rounded-xl border text-sm font-medium"
              style={{
                borderColor: `${theme.accent}80`,
                background: `${theme.accent}20`,
                color: theme.accent,
                boxShadow: `0 0 20px ${theme.accentGlow}`,
              }}
              initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              ✵ Achievement unlocked: {newAchievements.join(", ")}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── MAIN CONTENT ───────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">

          {/* LIFE TAB */}
          {tab === "life" && (
            <div className="px-3 py-2 space-y-3 pb-20">
              {/* Identity Block */}
              <div className="block-panel flex gap-3 p-2.5 items-center">
                <div className="w-16 h-16 bg-white rounded-lg border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0_0_rgba(0,0,0,0.2)] overflow-hidden"
                  dangerouslySetInnerHTML={{
                    __html: getSpriteSvg(state.bloodline, state.gender, state.age, Math.floor(state.dnaSeed * 1000), state.outfitStyle, state.accessory)
                  }} />
                <div className="flex-1 min-w-0">
                  <div className="font-heading font-bold text-xl leading-none truncate mb-1">{state.name}</div>
                  <div className="text-xs font-bold text-gray-800 flex items-center gap-1">
                    <span>🌍</span> {state.realm}
                  </div>
                </div>
                <div className="bg-white border-2 border-black rounded-lg p-2 text-right shadow-[2px_2px_0_0_rgba(0,0,0,0.2)]">
                  <div className="text-[10px] font-bold text-green-600 uppercase">Bank Balance</div>
                  <div className="font-heading font-bold text-green-600 text-lg">{formatWealth(state.stats.wealth)}</div>
                </div>
              </div>

              {/* Identity Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="block-panel-light flex items-center gap-2 p-2">
                  <span className="text-2xl ml-1">🎂</span>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-[#D90429]">Age</div>
                    <div className="font-heading font-bold text-base leading-tight">{state.age}</div>
                  </div>
                </div>
                <div className="block-panel-light flex items-center gap-2 p-2">
                  <span className="text-2xl ml-1">💼</span>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase font-bold text-[#D90429]">Job</div>
                    <div className="font-heading font-bold text-sm leading-tight truncate">{careerTitle}</div>
                  </div>
                </div>
                <div className="block-panel-light flex items-center gap-2 p-2">
                  <span className="text-2xl ml-1">🎓</span>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase font-bold text-[#D90429]">Education</div>
                    <div className="font-heading font-bold text-sm leading-tight truncate">Average</div>
                  </div>
                </div>
                <div className="block-panel-light flex items-center gap-2 p-2">
                  <span className="text-2xl ml-1">❤️</span>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase font-bold text-[#D90429]">Relationship</div>
                    <div className="font-heading font-bold text-sm leading-tight truncate">Single</div>
                  </div>
                </div>
              </div>

              {/* Mystical Path (If active) */}
              {hasMysticalPath && mysticalTitle && (
                <div className="block-panel bg-purple-400 p-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{mysticalIcon}</span>
                    <span className="font-heading font-bold text-white text-shadow-sm">{mysticalTitle}</span>
                  </div>
                  <div className="text-sm font-bold text-white text-shadow-sm">
                    {PATH_CURRENCY_ICONS[state.mysticalPath]} {state.mysticalExp} / {mysticalExpThreshold}
                  </div>
                </div>
              )}

              {/* Titles */}
              {state.titles && state.titles.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {state.titles.map((t, i) => (
                    <span key={i} title={`Title: ${t}`} className="text-[10px] font-black uppercase tracking-wider bg-[#FFD166] text-black px-2 py-0.5 rounded-full border border-black shadow-[0_2px_0_0_#000] hover:bg-[#ffb703] hover:shadow-[0_4px_0_0_#000] transition-all cursor-help">
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Abilities */}
              {state.abilities && state.abilities.length > 0 && (
                <div className="flex flex-col gap-1 mt-3">
                  <div className="text-[10px] font-black text-[#D90429] uppercase tracking-widest">Active Powers</div>
                  <div className="flex flex-wrap gap-2">
                    {state.abilities.map((ability, i) => (
                      <span key={i} className="text-[11px] font-black text-white bg-[#D90429] px-2 py-1 rounded-md border-[2px] border-black shadow-[0_2px_0_0_#000]">
                        ⚡ {ability}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Age Up Buttons & Stance */}
              <div className="flex flex-col gap-2 my-4">
                <div className="flex gap-2 items-center justify-center">
                  <button
                    onClick={handleAgeUp} disabled={!canAge}
                    className="block-btn block-btn-pink flex-1 py-4 flex items-center justify-center gap-2 text-2xl">
                    {isChronicling ? (
                      <span className="text-xl font-black">The Chronicler is writing...</span>
                    ) : (
                      <><span className="text-3xl font-black">+</span> Age Up</>
                    )}
                  </button>
                  <button
                    onClick={handleAgeUp} disabled={!canAge}
                    className="block-btn bg-[#FFD166] text-black border-[3px] border-black px-4 py-4 text-xl font-black shadow-[0_4px_0_0_#000] active:shadow-none active:translate-y-[4px]">
                    +10Y
                  </button>
                </div>
                
                {/* Stance Selector */}
                <div className="flex items-center justify-between bg-white border-[2px] border-black p-2 shadow-[0_2px_0_0_#000]">
                  <span className="text-xs font-black uppercase text-gray-500 mr-2">Stance</span>
                  <select 
                    className="flex-1 bg-transparent border-none outline-none font-bold text-sm cursor-pointer appearance-none text-right"
                    value={state.activeStance || "Balanced"}
                    onChange={(e) => setStance(e.target.value as FocusStance)}
                  >
                    <option value="Balanced">Balanced (+All)</option>
                    <option value="Aggressive Expansion">Aggressive Expansion (+Wealth, -Health)</option>
                    <option value="Deep Cultivation">Deep Cultivation (+Exp, -Relationships)</option>
                    <option value="Social Climbing">Social Climbing (+Rep, -Wealth)</option>
                    <option value="Survival">Survival (+Health/Luck, -Wealth)</option>
                  </select>
                </div>
              </div>

              {/* Life Stats */}
              <div className="block-panel-dark p-3 space-y-3">
                <div className="font-heading font-bold text-lg text-white mb-1">Life Stats</div>
                {[
                  { key: "happiness", label: "Happiness", icon: "😀", colorClass: "filled-yellow" },
                  { key: "health", label: "Health", icon: "❤️", colorClass: "filled-green" },
                  { key: "relationships", label: "Charm", icon: "✨", colorClass: "filled-blue" },
                  { key: "infamy", label: "Stress", icon: "🔥", colorClass: "filled-red" },
                ].map(stat => {
                  const val = Math.min(100, Math.max(0, state.stats[stat.key as keyof typeof state.stats] || 0));
                  const filledSegments = Math.round(val / 10);
                  return (
                    <div key={stat.key} className="flex items-center gap-2">
                      <span className="w-5 text-center">{stat.icon}</span>
                      <span className="w-20 text-xs font-bold text-gray-300">{stat.label}</span>
                      <div className="flex-1 stat-bar-container">
                        {[...Array(10)].map((_, i) => (
                          <div key={i} className={`stat-bar-segment ${i < filledSegments ? stat.colorClass : ""}`} />
                        ))}
                      </div>
                      <span className="w-10 text-right text-xs font-bold text-white">{val}%</span>
                    </div>
                  );
                })}
              </div>

              {/* Event Log */}
              <div className="mt-6 mb-4">
                {logGroups.length === 0 ? (
                  <div className="text-center py-10 opacity-50">
                    <div className="text-4xl mb-2">📖</div>
                    <p className="font-bold">Your story begins here.</p>
                  </div>
                ) : (
                  <div className="space-y-4 px-1">
                    {logGroups.map((group) => (
                      <motion.div key={group.age}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            AGE {group.age}
                          </span>
                          <div className="flex-1 h-[2px] bg-black/10" />
                        </div>
                        <div className="space-y-2 pl-2">
                          {group.entries.map((entry, ei) => {
                            const isImportant = entry.includes("BREAKTHROUGH") || entry.includes("⚡");
                            return (
                              <p key={ei} className={`text-sm ${isImportant ? "font-bold text-[#D90429]" : "font-semibold text-gray-800"}`}>
                                {entry}
                              </p>
                            );
                          })}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
                <div ref={logEndRef} className="h-4" />
              </div>
            </div>
          )}

          {/* JOB / STATS TAB */}
          {/* JOB TAB */}
          {tab === "job" && (
            <div className="px-3 py-2 space-y-3 pb-20">
              <div className="bg-surface-variant dark:bg-[#1e1e24] text-on-surface dark:text-white border-b-[3px] border-black dark:border-surface-variant px-4 py-3 -mx-3 -mt-2 mb-4 text-center font-heading font-black text-2xl uppercase tracking-widest shadow-[0_4px_0_0_rgba(0,0,0,0.1)]">
                Career
              </div>

              {/* Current job badge */}
              {state.activeJob && (() => {
                const job = JOBS.find(j => j.id === state.activeJob);
                return job ? (
                  <div className="block-panel bg-white p-3 flex items-center gap-3">
                    <span className="text-4xl bg-gray-100 rounded-lg p-2 border-[2px] border-black shadow-[inset_0_-3px_0_0_rgba(0,0,0,0.1)]">{job.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] uppercase font-bold text-[#D90429]">Current Role</div>
                      <div className="font-heading font-bold text-lg leading-tight text-black truncate">{job.title}</div>
                      <div className="text-xs font-bold text-gray-500 mt-1 truncate">{job.desc}</div>
                    </div>
                    <button onClick={() => handleJob(job.id)}
                      disabled={(state.actionsThisYear ?? 0) >= maxActions}
                      className="block-btn bg-[#06D6A0] text-black border-[2px] border-black px-3 py-2 text-sm font-black active:translate-y-1 shadow-[0_3px_0_0_#000] active:shadow-none">
                      Work
                    </button>
                  </div>
                ) : null;
              })()}

              {/* Job board */}
              <div className="block-panel bg-white p-3">
                <div className="font-heading font-bold text-xl mb-3 flex items-center justify-between text-black">
                  <span>Job Market</span>
                  <span className="text-sm bg-black text-white px-2 py-0.5 rounded-full">{availableJobs.length}</span>
                </div>
                
                {/* Filters */}
                <div className="flex gap-2 mb-3 overflow-x-auto pb-2 hide-scrollbar">
                  {["all", "common", "skilled", "expert", "elite", "legendary"].map(tier => (
                     <button key={tier} onClick={() => setJobTierFilter(tier)}
                        className={`px-3 py-1 text-xs font-bold border-[2px] border-black rounded-full shrink-0 transition-all ${
                          jobTierFilter === tier ? "bg-[#3E85E4] text-white shadow-[0_2px_0_0_#000]" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}>
                        {tier.toUpperCase()}
                     </button>
                  ))}
                </div>

                <div className="space-y-3">
                  {availableJobs
                    .filter(j => jobTierFilter === "all" || j.tier === jobTierFilter)
                    .slice(0, 12)
                    .map(job => {
                      const isActive = state.actionsThisYear < maxActions;
                      const isCurrent = state.activeJob === job.id;
                      return (
                        <div key={job.id} className={`flex items-center gap-3 p-2 rounded-xl border-[2px] border-black transition-colors ${isCurrent ? "bg-[#FFF4B0]" : "bg-gray-50 hover:bg-gray-100"}`}>
                          <span className="text-2xl">{job.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm leading-tight text-black truncate">{job.title}</div>
                            <div className="text-xs font-bold text-[#3E85E4] mt-0.5">
                              +{job.incomeMin}-{job.incomeMax} 🥇
                            </div>
                          </div>
                          <button onClick={() => handleJob(job.id)} disabled={!isActive}
                            className={`block-btn text-black px-3 py-1 text-xs font-black shadow-[0_2px_0_0_#000] active:translate-y-[2px] active:shadow-none border-[2px] border-black ${isCurrent ? "bg-[#FFD166]" : "bg-white"}`}>
                            {isCurrent ? "Work" : "Apply"}
                          </button>
                        </div>
                      );
                  })}
                  {availableJobs.filter(j => jobTierFilter === "all" || j.tier === jobTierFilter).length === 0 && (
                    <div className="text-center py-6 text-gray-400 font-bold text-sm">No jobs match this filter.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ASSETS TAB */}
          {/* ASSETS TAB */}
          {tab === "assets" && (
            <div className="px-3 py-2 space-y-3 pb-20">
              <div className="bg-surface-variant dark:bg-[#1e1e24] text-on-surface dark:text-white border-b-[3px] border-black dark:border-surface-variant px-4 py-3 -mx-3 -mt-2 mb-4 text-center font-heading font-black text-2xl uppercase tracking-widest shadow-[0_4px_0_0_rgba(0,0,0,0.1)]">
                Assets
              </div>
              <div className="block-panel bg-white p-4 flex justify-between items-center text-black">
                <div>
                  <div className="text-[10px] font-bold uppercase text-gray-500">Holdings</div>
                  <div className="text-3xl font-heading font-black text-[#3E85E4]">{state.properties.length}</div>
                  <div className="text-xs font-bold text-gray-500">Properties</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase text-[#D90429]">Net Worth</div>
                  <div className="text-3xl font-heading font-black text-[#06D6A0]">{state.stats.wealth}</div>
                  <div className="text-xs font-bold text-[#06D6A0]">{formatWealth(state.stats.wealth)}</div>
                </div>
              </div>

              {state.properties.length === 0 ? (
                <div className="block-panel bg-gray-50 p-8 text-center text-black">
                  <div className="text-5xl mb-2 grayscale">🏠</div>
                  <p className="font-bold text-gray-400">You own nothing yet.</p>
                </div>
              ) : (
                Object.entries(propsByCategory).map(([cat, props]) => (
                  <div key={cat} className="block-panel bg-white p-3">
                    <h4 className="text-xs font-black text-black uppercase tracking-widest flex items-center gap-2 mb-3 border-b-2 border-black pb-2">
                      <span>{PROP_CAT_ICONS[cat as PropertyCategory]}</span> {cat}
                    </h4>
                    {props.map(p => (
                      <div key={p.type} className="flex justify-between py-2 border-b-2 border-dashed border-gray-200 last:border-0 items-center">
                        <span className="font-bold text-sm text-black">{p.type}</span>
                        <span className="text-[10px] font-bold text-white bg-black px-2 py-0.5 rounded-full">Age {p.acquiredAge}</span>
                      </div>
                    ))}
                  </div>
                ))
              )}

              {/* Inventory */}
              {state.inventory && state.inventory.length > 0 && (
                <div className="block-panel bg-white p-3 mt-4">
                  <h4 className="text-xs font-black text-[#D90429] uppercase tracking-widest flex items-center gap-2 mb-3 border-b-2 border-black pb-2">
                    <span>🎒</span> Inventory
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {state.inventory.map((item, i) => (
                      <div key={i} title={`Item: ${item}`} className="bg-gray-50 border-[2px] border-black rounded-lg p-2 text-sm font-bold text-black shadow-[0_2px_0_0_rgba(0,0,0,0.1)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3)] hover:-translate-y-0.5 transition-all truncate flex items-center gap-2 cursor-help">
                        <span>💠</span> {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BONDS TAB */}
          {/* BONDS TAB */}
          {tab === "bonds" && (
            <div className="px-3 py-2 space-y-3 pb-20">
              <div className="bg-surface-variant dark:bg-[#1e1e24] text-on-surface dark:text-white border-b-[3px] border-black dark:border-surface-variant px-4 py-3 -mx-3 -mt-2 mb-4 text-center font-heading font-black text-2xl uppercase tracking-widest shadow-[0_4px_0_0_rgba(0,0,0,0.1)]">
                Bonds
              </div>

              {/* Action feedback */}
              <AnimatePresence>
                {actFeedback && (
                  <motion.div
                    className={`p-3 rounded-xl text-sm font-bold border-[2px] border-black shadow-[0_2px_0_0_#000] mb-2 ${
                      actFeedback.ok ? "bg-[#06D6A0] text-black" : "bg-[#EF476F] text-white"
                    }`}
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {actFeedback.ok ? "✓" : "✗"} {actFeedback.msg}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="block-panel bg-white p-5 text-center text-black">
                <div className="text-6xl drop-shadow-[0_4px_0_rgba(0,0,0,0.1)] mb-2">❤️</div>
                <div className="text-4xl font-heading font-black text-[#F74C9D]">{state.stats.relationships}</div>
                <div className="font-bold text-xs uppercase text-gray-500 mt-1">Relationship Score</div>
              </div>

              {/* ── Family Members ── */}
              {state.familyMembers && state.familyMembers.length > 0 && (
                <div className="block-panel bg-white p-3">
                  <h4 className="text-sm font-black uppercase text-black mb-3 flex items-center gap-2 border-b-2 border-black pb-2">
                    <span>👨‍👩‍👧</span>
                    <span>Family</span>
                    {state.familyName && (
                      <span className="text-gray-400 font-bold normal-case text-xs ml-auto">{state.familyName}</span>
                    )}
                  </h4>
                  <div className="space-y-2">
                    {state.familyMembers.map((m, i) => (
                      <div key={i} className="flex flex-col gap-2 p-2 rounded-xl border-[2px] border-black bg-gray-50 shadow-[0_2px_0_0_#000]">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl border-[2px] border-black flex items-center justify-center text-xl shrink-0 shadow-[0_2px_0_0_#000] ${m.alive ? 'bg-[#FFD166]' : 'bg-gray-200 grayscale'}`}>
                            {m.relation === "father" ? "👨" : m.relation === "mother" ? "👩" : m.relation === "sibling" ? "🧑" : "👴"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-bold truncate ${m.alive ? 'text-black' : 'text-gray-400 line-through'}`}>{m.name}</div>
                            <div className="text-[10px] font-bold text-gray-500 capitalize">{m.relation} · Age {m.age}</div>
                          </div>
                          <div className={`text-[10px] font-black px-2 py-1 rounded-md border-[2px] border-black ${m.alive ? 'bg-white text-[#F74C9D]' : 'bg-gray-200 text-gray-500'}`}>
                            ♥ {m.affection ?? 50}
                          </div>
                        </div>
                        {m.alive && (
                          <div className="flex gap-2">
                            <button onClick={() => handleInteractFamily(m.id, "chat")} className="flex-1 block-btn bg-white text-black border-[2px] border-black px-2 py-1 text-xs font-black shadow-[0_2px_0_0_#000] active:translate-y-[2px] active:shadow-none">Chat</button>
                            <button onClick={() => handleInteractFamily(m.id, "gift")} className="flex-1 block-btn bg-white text-black border-[2px] border-black px-2 py-1 text-xs font-black shadow-[0_2px_0_0_#000] active:translate-y-[2px] active:shadow-none">Gift</button>
                            <button onClick={() => handleInteractFamily(m.id, "argue")} className="flex-1 block-btn bg-white text-red-500 border-[2px] border-black px-2 py-1 text-xs font-black shadow-[0_2px_0_0_#000] active:translate-y-[2px] active:shadow-none">Argue</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {state.generation > 1 && (
                    <p className="text-[10px] font-bold text-gray-400 mt-3 text-center bg-gray-50 p-2 rounded-lg border-[2px] border-black border-dashed">
                      Gen {state.generation} · Lineage of {state.inheritedSoul?.parentName}
                    </p>
                  )}
                </div>
              )}

              {/* ── Partners / Inner Chamber ── */}
              {state.romanceLevel !== "none" && (
                <div className="block-panel bg-white p-3">
                  <h4 className="text-sm font-black uppercase text-[#F74C9D] mb-3 flex items-center justify-between border-b-2 border-black pb-2">
                    <span>♥ Inner Chamber</span>
                    <span className="text-black font-bold normal-case text-xs px-2 py-0.5 bg-gray-100 rounded-full border-[2px] border-black">{state.partners.length} / 8</span>
                  </h4>
                  {state.partners.length === 0 ? (
                    <p className="text-xs font-bold text-gray-400 text-center py-4 bg-gray-50 rounded-xl border-[2px] border-dashed border-gray-200">
                      No partners yet. Use Love activities to find someone.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {state.partners.map((p, i) => {
                        const roleColor: Record<PartnerRole, string> = {
                          spouse: "#F0C040", consort: "#C084FC", lover: "#F472B6",
                        };
                        const roleIcon: Record<PartnerRole, string> = {
                          spouse: "💍", consort: "👑", lover: "❤",
                        };
                        const rc = roleColor[p.role];
                        return (
                          <div key={i} className="flex flex-col gap-2 p-2 rounded-xl border-[2px] border-black bg-gray-50 shadow-[0_2px_0_0_#000]">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 bg-white border-[2px] border-black shadow-[0_2px_0_0_#000]">
                                {roleIcon[p.role]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="text-sm font-bold text-black truncate">{p.name}</span>
                                  <span className="text-[10px] font-bold text-gray-500 uppercase">· {p.role} · Age {p.age}</span>
                                </div>
                                <div className="text-[10px] font-bold text-gray-500 mb-1">Trait: {p.trait || "Average"}</div>
                                <div className="h-2.5 rounded-full overflow-hidden border-[2px] border-black bg-white">
                                  <div className="h-full transition-all" style={{ background: rc, width: `${p.affection}%` }} />
                                </div>
                              </div>
                              <span className="text-xs font-black px-2 py-1 bg-white border-[2px] border-black rounded-lg shadow-[0_2px_0_0_#000] shrink-0" style={{ color: rc }}>{p.affection}</span>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleInteractPartner(p.id, "chat")} className="flex-1 block-btn bg-white text-black border-[2px] border-black px-2 py-1 text-xs font-black shadow-[0_2px_0_0_#000] active:translate-y-[2px] active:shadow-none">Chat</button>
                              <button onClick={() => handleInteractPartner(p.id, "gift")} className="flex-1 block-btn bg-white text-black border-[2px] border-black px-2 py-1 text-xs font-black shadow-[0_2px_0_0_#000] active:translate-y-[2px] active:shadow-none">Gift</button>
                              <button onClick={() => handleInteractPartner(p.id, "intimate")} className="flex-1 block-btn bg-[#FFD166] text-black border-[2px] border-black px-2 py-1 text-xs font-black shadow-[0_2px_0_0_#000] active:translate-y-[2px] active:shadow-none">Intimacy</button>
                              <button onClick={() => handleInteractPartner(p.id, "breakup")} className="flex-1 block-btn bg-white text-red-500 border-[2px] border-black px-2 py-1 text-xs font-black shadow-[0_2px_0_0_#000] active:translate-y-[2px] active:shadow-none">End It</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── Children / Progeny ── */}
              {state.children.length > 0 && (
                <div className="block-panel bg-white p-3">
                  <h4 className="text-sm font-black uppercase text-[#C084FC] mb-3 border-b-2 border-black pb-2">
                    👶 Bloodline Heirs · {state.children.length}
                  </h4>
                  <div className="space-y-2">
                    {state.children.map((child, i) => {
                      const childTalentDef = TALENTS[child.talent ?? "Average"];
                      return (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-xl border-[2px] border-black bg-gray-50">
                          <div className="w-10 h-12 shrink-0 bg-white border-[2px] border-black rounded-lg shadow-[0_2px_0_0_#000] overflow-hidden flex items-center justify-center"
                            dangerouslySetInnerHTML={{ __html: getSpriteSvg(child.bloodline, child.gender, child.age, (i + 1) * 333) }} />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-[#C084FC] truncate">{child.name}</div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase">{child.gender} · {child.bloodline} · Age {child.age}</div>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full border-[2px] border-black bg-white inline-flex items-center gap-1 mt-1" style={{ color: childTalentDef.color }}>
                              {childTalentDef.icon} {child.talent ?? "Average"}
                            </span>
                          </div>
                          <div className="text-[10px] font-black px-2 py-1 bg-[#C084FC] text-white border-[2px] border-black rounded-lg shadow-[0_2px_0_0_#000] shrink-0">
                            {child.age >= 18 ? "ADULT" : child.age >= 13 ? "TEEN" : child.age >= 3 ? "CHILD" : "INFANT"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 mt-3 text-center bg-gray-50 p-2 rounded-lg border-[2px] border-black border-dashed">
                    When you die, continue as one of your heirs.
                  </p>
                </div>
              )}

              {/* ── Inherited Soul ── */}
              {state.inheritedSoul && (
                <div className="block-panel bg-[#3E85E4] p-3 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl bg-white rounded-full w-8 h-8 flex items-center justify-center text-black border-[2px] border-black shadow-[0_2px_0_0_#000]">{state.inheritedSoul.type === "reincarnation" ? "✦" : "👶"}</span>
                    <span className="font-black uppercase tracking-wider text-xs">
                      {state.inheritedSoul.type === "reincarnation" ? "Soul Memory" : "Noble Heritage"}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold opacity-90 mt-1 pl-10">
                    Generation {state.generation} · Descended from <span className="text-[#FFD166]">{state.inheritedSoul.parentName}</span>
                  </p>
                </div>
              )}

              {/* Relationship / Life Stats */}
              <div className="block-panel bg-white p-4 space-y-3">
                <h4 className="text-sm font-black text-black uppercase tracking-widest mb-3 border-b-2 border-black pb-2">Reputation</h4>
                {(["relationships","charisma","reputation","faith"] as const).map(k => (
                  <div key={k}>
                    <div className="flex justify-between text-[10px] font-bold uppercase mb-1 text-black">
                      <span>{k}</span>
                      <span>{state.stats[k]}</span>
                    </div>
                    <div className="h-3 border-[2px] border-black bg-gray-100 rounded-full overflow-hidden">
                      <motion.div className={`h-full ${STAT_COLORS_FULL[k]}`}
                        initial={false} animate={{ width: `${state.stats[k]}%` }}
                        transition={{ duration: 0.4 }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Life Summary */}
              <div className="block-panel bg-white p-3">
                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 text-center">Life Summary</h4>
                <div className="grid grid-cols-2 gap-3 text-center">
                  {([
                    ["Age", state.age],
                    ["Legacy", state.legacyScore.toLocaleString()],
                    ["Events", state.triggeredEvents.length],
                    ["Explored", state.exploredLocations?.length ?? 0],
                  ] as [string, string | number][]).map(([label, val]) => (
                    <div key={label} className="py-2 rounded-xl border-[2px] border-black bg-gray-50 shadow-[0_2px_0_0_#000]">
                      <div className="font-heading font-black text-xl text-[#3E85E4]">{val}</div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ACTIVITIES TAB */}
          {tab === "activities" && (
            <div className="flex flex-col h-full">
              {/* Per-year action budget banner */}
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <div className="flex items-center gap-2">
                  {[...Array(maxActions)].map((_, i) => (
                    <div key={i} className="w-3 h-3 rounded-full border transition-all"
                      style={{
                        background: i < actionsUsed ? `${theme.accent}60` : `${theme.accent}18`,
                        borderColor: i < actionsUsed ? theme.accent : `${theme.accent}40`,
                      }} />
                  ))}
                  <span className="text-xs ml-1" style={{ color: actionsLeft === 0 ? "#f87171" : theme.accent }}>
                    {actionsLeft > 0 ? `${actionsLeft} action${actionsLeft !== 1 ? "s" : ""} left` : "Age up to continue!"}
                  </span>
                </div>
                <span className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{ background: `${talentDef.color}15`, color: talentDef.color }}>
                  {talentDef.icon} {state.talent}
                </span>
              </div>

              <div className="flex gap-2 px-4 pt-2 pb-2 overflow-x-auto shrink-0"
                style={{ scrollbarWidth: "none" }}>
                {actCats.map(c => (
                  <button key={c.key} onClick={() => setActCat(c.key)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all"
                    style={actCat === c.key ? {
                      background: `${theme.accent}25`,
                      borderColor: `${theme.accent}80`,
                      color: theme.accent,
                    } : {
                      borderColor: "rgba(255,255,255,0.1)",
                      color: "hsl(240,5%,60%)",
                    }}>
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>

              <AnimatePresence>
                {actFeedback && (
                  <motion.div
                    className="mx-4 mb-2 px-4 py-2.5 rounded-xl text-sm border"
                    style={actFeedback.ok ? {
                      borderColor: "rgba(74,222,128,0.4)",
                      background: "rgba(74,222,128,0.1)",
                      color: "#4ade80",
                    } : {
                      borderColor: "rgba(248,113,113,0.4)",
                      background: "rgba(248,113,113,0.1)",
                      color: "#f87171",
                    }}
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {actFeedback.ok ? "✓" : "✗"} {actFeedback.msg}
                  </motion.div>
                )}
              </AnimatePresence>

              {(actCat === "cultivation" || actCat === "arcane" || actCat === "sacred" || actCat === "rune") &&
               !hasMysticalPath && (
                <div className="mx-4 p-4 rounded-xl border text-center"
                  style={{ borderColor: `${theme.accent}25`, background: `${theme.accent}05` }}>
                  <p className="text-sm text-muted-foreground">You have not yet entered this path.</p>
                  <p className="text-xs text-muted-foreground mt-1">Unlock it through life events.</p>
                </div>
              )}

              <div className="overflow-y-auto px-4 pb-4 space-y-2">
                {visibleActivities.map(a => {
                  const tooYoung   = !!a.minAge && state.age < a.minAge;
                  const statBlock  = !!(a.reqStat && state.stats[a.reqStat.key] < a.reqStat.min);
                  const broke      = !!(a.cost && state.stats.wealth < a.cost);
                  const wrongPath  = !!(a.reqPath && state.mysticalPath !== a.reqPath);
                  const noActions  = actionsLeft === 0;
                  const blocked    = tooYoung || statBlock || broke || wrongPath || noActions;
                  const boosted = talentDef.statMult > 1 && Object.values(a.effects).some(v => (v as number) > 0);

                  return (
                    <motion.button key={a.key}
                      onClick={() => !blocked && handleActivity(a.key)}
                      disabled={blocked}
                      whileTap={blocked ? {} : { scale: 0.98 }}
                      className="w-full flex items-start gap-3 px-4 py-3.5 rounded-xl border transition-all text-left group"
                      style={blocked ? {
                        borderColor: "rgba(255,255,255,0.08)",
                        background: theme.cardBg,
                        opacity: 0.4,
                        cursor: "not-allowed",
                      } : {
                        borderColor: theme.borderColor,
                        background: theme.cardBg,
                      }}>
                      <span className="text-2xl w-8 text-center shrink-0 mt-0.5">{a.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-serif text-sm font-medium text-foreground flex items-center gap-1.5">
                          {a.label}
                          {boosted && !blocked && (
                            <span className="text-xs px-1 py-0.5 rounded"
                              style={{ background: `${talentDef.color}15`, color: talentDef.color }}>
                              ×{talentDef.statMult}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{a.desc}</div>
                        {tooYoung  && <div className="text-xs text-amber-500/80 mt-1">Min age: {a.minAge}</div>}
                        {statBlock && <div className="text-xs text-amber-500/80 mt-1">{a.reqStat!.key} {a.reqStat!.min}+ required</div>}
                        {broke     && <div className="text-xs text-rose-500/80 mt-1">Costs {a.cost} wealth</div>}
                        {(a.cultivatorExp || a.mysticalExp) && (
                          <div className="text-xs mt-1 font-medium" style={{ color: mysticalColor || theme.accent }}>
                            {PATH_CURRENCY_ICONS[state.mysticalPath]} +{a.cultivatorExp ?? a.mysticalExp} {PATH_CURRENCY_NAMES[state.mysticalPath]}
                          </div>
                        )}
                        {noActions && !tooYoung && !statBlock && !broke && !wrongPath && (
                          <div className="text-xs text-red-400 mt-1">No actions left this year</div>
                        )}
                      </div>
                      <div className="text-right text-xs shrink-0 space-y-0.5 mt-0.5">
                        {a.cost && <div className="text-rose-400">-{a.cost}w</div>}
                        {a.riskChance && <div className="text-amber-400">{Math.round(a.riskChance * 100)}% risk</div>}
                        <div className="text-emerald-400">
                          {Object.entries(a.effects).slice(0, 2).map(([k, v]) =>
                            `${(v as number) > 0 ? "+" : ""}${v} ${k}`).join(" ")}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* MAP TAB */}
          {/* MAP TAB */}
          {tab === "map" && (
            <div className="px-3 py-2 space-y-3 pb-20 bg-transparent">
              <div className="bg-surface-variant dark:bg-[#1e1e24] text-on-surface dark:text-white border-b-[3px] border-black dark:border-surface-variant px-4 py-3 -mx-3 -mt-2 mb-4 text-center font-heading font-black text-2xl uppercase tracking-widest shadow-[0_4px_0_0_rgba(0,0,0,0.1)]">
                Map
              </div>

              {/* Action feedback */}
              <AnimatePresence>
                {actFeedback && (
                  <motion.div
                    className={`p-3 rounded-xl text-sm font-bold border-[2px] border-black shadow-[0_2px_0_0_#000] mb-2 ${
                      actFeedback.ok ? "bg-[#06D6A0] text-black" : "bg-[#EF476F] text-white"
                    }`}
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {actFeedback.ok ? "✓" : "✗"} {actFeedback.msg}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Realm Map */}
              <div className="block-panel bg-white p-3">
                <div className="flex items-center justify-between mb-3 border-b-2 border-black pb-2">
                  <h3 className="font-heading font-black text-xl text-black">
                    {theme.particles[0]} {state.realm}
                  </h3>
                  <span className="text-[10px] font-bold bg-black text-white px-2 py-0.5 rounded-full border-[2px] border-black shadow-[0_2px_0_0_#000]">
                    {state.exploredLocations?.length ?? 0}/{realmLocations.length} EXPLORED
                  </span>
                </div>
                <p className="text-xs font-bold text-gray-500 mb-3 italic">{theme.ambientDesc}</p>

                {actionsLeft === 0 && (
                  <div className="mb-3 px-3 py-2 rounded-lg text-xs font-bold text-center bg-[#EF476F] text-white border-[2px] border-black shadow-[0_2px_0_0_#000]">
                    NO ACTIONS LEFT — AGE UP TO EXPLORE MORE
                  </div>
                )}

                <div className="space-y-3">
                  {realmLocations.map(loc => {
                    const explored = state.exploredLocations?.includes(loc.id);
                    const blocked = !!(loc.minStat && state.stats[loc.minStat.key] < loc.minStat.min);
                    const pathBlocked = !!(loc.reqPath && state.mysticalPath !== loc.reqPath);
                    const noAct = actionsLeft === 0;
                    const canExplore = !blocked && !pathBlocked && !noAct;
                    const rc = RARITY_COLOR[loc.rarity];

                    return (
                      <motion.button key={loc.id}
                        onClick={() => canExplore && handleExplore(loc.id)}
                        disabled={!canExplore}
                        whileTap={canExplore ? { scale: 0.98 } : {}}
                        className={`w-full flex items-start gap-3 p-3 rounded-xl border-[2px] border-black transition-all text-left ${
                          (!canExplore && !explored) ? "bg-gray-100 opacity-60 cursor-not-allowed grayscale-[0.5]" : explored ? "bg-white shadow-[0_3px_0_0_#000] active:translate-y-1 active:shadow-none" : "bg-white shadow-[0_3px_0_0_#000] hover:bg-gray-50 active:translate-y-1 active:shadow-none"
                        }`}>
                        <span className={`text-3xl w-10 h-10 flex items-center justify-center shrink-0 rounded-lg border-[2px] border-black shadow-[inset_0_-3px_0_0_rgba(0,0,0,0.1)] ${explored ? 'bg-gray-100' : 'bg-[#FFD166]'}`}>{loc.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-bold text-sm text-black truncate">{loc.name}</span>
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full border-[2px] border-black bg-white" style={{ color: rc }}>{loc.rarity}</span>
                            {explored && (
                              <span className="text-[10px] font-black text-[#06D6A0] bg-[#06D6A0]/10 px-1.5 py-0.5 rounded ml-auto">✓ VISITED</span>
                            )}
                          </div>
                          <p className="text-[10px] font-bold text-gray-500">{loc.desc}</p>
                          <p className="text-[10px] font-bold mt-1" style={{ color: rc }}>{loc.flavorText}</p>
                          {loc.danger && (
                            <span className="text-[10px] font-black text-[#EF476F] bg-[#EF476F]/10 px-1.5 py-0.5 rounded inline-block mt-1">⚠ DANGEROUS</span>
                          )}
                          {blocked && (
                            <div className="text-[10px] font-black text-[#F78C6B] mt-1 bg-[#F78C6B]/10 px-1.5 py-0.5 rounded inline-block">Requires {loc.minStat!.key} ≥ {loc.minStat!.min}</div>
                          )}
                          {pathBlocked && (
                            <div className="text-[10px] font-black text-[#F78C6B] mt-1 bg-[#F78C6B]/10 px-1.5 py-0.5 rounded inline-block">Requires {loc.reqPath!.replace("_"," ")} path</div>
                          )}
                        </div>
                        <div className="text-right text-[10px] font-black shrink-0 space-y-1 mt-0.5 flex flex-col items-end">
                          {Object.entries(loc.effects).slice(0, 2).map(([k, v]) => (
                            <div key={k} className="text-[#06D6A0] bg-[#06D6A0]/10 px-1.5 py-0.5 rounded">
                              {(v as number) > 0 ? "+" : ""}{v} {k.slice(0,3)}
                            </div>
                          ))}
                          {loc.mysticalExp && (
                            <div className="bg-[#9D4EDD] text-white px-1.5 py-0.5 rounded border-[2px] border-black">+{loc.mysticalExp} exp</div>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* World Legends (compact) */}
              <div className="block-panel bg-white p-3">
                <div className="flex items-center justify-between mb-3 border-b-2 border-black pb-2">
                  <h3 className="font-heading font-black text-xl text-[#FFD166] drop-shadow-[0_2px_0_rgba(0,0,0,1)]">
                    World Powers
                  </h3>
                  <button onClick={() => setTab("world")} className="block-btn bg-black text-white px-2 py-1 text-[10px] font-bold shadow-[0_2px_0_0_#FFF,0_2px_0_0_#000]">
                    View World →
                  </button>
                </div>

                <div className="mb-3 px-3 py-3 rounded-xl text-center border-[2px] border-black bg-[#3E85E4] text-white shadow-[inset_0_-3px_0_0_rgba(0,0,0,0.2)]">
                  <div className="text-[10px] font-bold uppercase tracking-wider">Your Legacy</div>
                  <div className="font-heading font-black text-2xl drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]">
                    {state.legacyScore.toLocaleString()} ✵
                  </div>
                  {state.cosmicTier && (
                    <div className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded-full inline-block mt-1">Cosmic Standing: {state.cosmicTier}</div>
                  )}
                </div>

                <div className="space-y-2">
                  {topLegends.map((npc, i) => {
                    const rc = ["#FFD166","#E5E5E5","#F78C6B"][i] ?? "#8898a8";
                    return (
                      <div key={npc.name} className="flex items-center gap-2 rounded-xl p-2 border-[2px] border-black bg-white shadow-[0_2px_0_0_#000] hover:bg-gray-50 transition-colors cursor-pointer active:translate-y-0.5 active:shadow-none"
                        onClick={() => setChatNpc(npc)}>
                        <div className="font-black text-xs w-6 text-center shrink-0" style={{ color: rc }}>
                          {i === 0 ? "👑" : `#${i+1}`}
                        </div>
                        <div className="w-8 h-8 rounded-lg border-[2px] border-black shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.1)] flex items-center justify-center text-sm shrink-0 bg-gray-100">
                          {npc.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-black truncate">{npc.name}</div>
                          <div className="text-[10px] font-bold text-gray-500 truncate">{npc.title}</div>
                          {npc.cosmicTier && (
                            <div className="text-[10px] font-bold text-[#3E85E4]">{npc.cosmicTier}</div>
                          )}
                        </div>
                        <div className="font-black text-xs shrink-0 bg-gray-100 px-2 py-1 border-[2px] border-black rounded-lg">
                          {(npc.livepower / 1000).toFixed(1)}k
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mystical Path Panel */}
              {hasMysticalPath && (
                <div className="block-panel bg-[#9D4EDD] p-3 text-white border-[2px] border-black">
                  <h4 className="text-sm font-black uppercase tracking-widest mb-3 flex items-center gap-2 border-b-2 border-black pb-2">
                    <span className="bg-white text-black rounded p-1 border-[2px] border-black shadow-[0_2px_0_0_#000]">{mysticalIcon}</span> {MYSTICAL_PATH_NAMES[state.mysticalPath]} Path
                  </h4>
                  <div className="text-center mb-3">
                    <div className="text-2xl font-heading font-black drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]">
                      {mysticalTitle}
                    </div>
                    <div className="text-[10px] font-bold bg-white/20 inline-block px-2 py-0.5 rounded-full mt-1">
                      Tier {state.mysticalTier}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-1 px-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase">
                      <span>{PATH_CURRENCY_ICONS[state.mysticalPath]}</span>
                      <span>{PATH_CURRENCY_NAMES[state.mysticalPath]}</span>
                    </div>
                    <span className="text-[10px] font-black bg-black px-1.5 py-0.5 rounded border border-white/20">
                      {state.mysticalExp} / {mysticalExpThreshold}
                    </span>
                  </div>
                  <div className="h-3 rounded-full border-[2px] border-black bg-black/50 overflow-hidden mb-2">
                    <motion.div className="h-full bg-white"
                      initial={false}
                      animate={{ width: `${mysticalExpPct}%` }}
                      transition={{ duration: 0.5 }} />
                  </div>
                </div>
              )}
              {!hasMysticalPath && (
                <div className="block-panel bg-white p-3 border-[2px] border-black border-dashed">
                  <h4 className="text-sm font-black uppercase tracking-widest mb-2 text-[#9D4EDD]">
                    Mystical Potential
                  </h4>
                  <p className="text-[10px] font-bold text-gray-500 mb-3">
                    Four great paths await awakening through life events:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon:"⚡", name:"Qi Cultivation",   color:"#f0a830" },
                      { icon:"✦",  name:"Arcane Magic",      color:"#8080ff" },
                      { icon:"✵",  name:"Sacred Arts",       color:"#f0d040" },
                      { icon:"⬡",  name:"Rune Smithing",     color:"#50d0c0" },
                    ].map(p => (
                      <div key={p.name} className="p-2 rounded-xl text-center bg-gray-50 border-[2px] border-black shadow-[0_2px_0_0_#000]">
                        <div className="text-2xl bg-white border-[2px] border-black rounded-lg inline-block p-1 shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.1)] mb-1">{p.icon}</div>
                        <div className="text-[10px] font-black uppercase" style={{ color: p.color }}>{p.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── WORLD TAB ── */}
          {/* ── WORLD TAB ── */}
          {tab === "world" && (
            <div className="px-3 py-2 space-y-3 pb-20 bg-transparent">
              <div className="bg-surface-variant dark:bg-[#1e1e24] text-on-surface dark:text-white border-b-[3px] border-black dark:border-surface-variant px-4 py-3 -mx-3 -mt-2 mb-4 text-center font-heading font-black text-2xl uppercase tracking-widest shadow-[0_4px_0_0_rgba(0,0,0,0.1)]">
                World
              </div>

              {/* World status banner */}
              <div className="block-panel bg-white p-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[#FFD166]/10 p-2 rounded-xl border-[2px] border-[#FFD166]">
                    <div className="text-xl font-heading font-black text-[#FFD166]">{worldState.year}</div>
                    <div className="text-[10px] font-bold uppercase text-gray-500">World Year</div>
                  </div>
                  <div className="bg-[#EF476F]/10 p-2 rounded-xl border-[2px] border-[#EF476F]">
                    <div className="text-xl font-heading font-black text-[#EF476F]">{worldState.activeWars.length}</div>
                    <div className="text-[10px] font-bold uppercase text-gray-500">Active Wars</div>
                  </div>
                  <div className="bg-gray-100 p-2 rounded-xl border-[2px] border-gray-300">
                    <div className="text-xl font-heading font-black text-gray-400">
                      {WORLD_NPCS.filter(n => worldState.npcAlive[n.name] === false).length}
                    </div>
                    <div className="text-[10px] font-bold uppercase text-gray-500">Fallen</div>
                  </div>
                </div>
              </div>

              {/* Active wars */}
              {worldState.activeWars.length > 0 && (
                <div className="block-panel bg-[#EF476F] p-3 text-white border-[2px] border-black">
                  <h4 className="text-sm font-black uppercase tracking-widest mb-3 flex items-center gap-2 border-b-2 border-black pb-2">
                    <span className="bg-white text-black p-1 rounded border-[2px] border-black">⚔</span> Active Wars
                  </h4>
                  {worldState.activeWars.map(war => (
                    <div key={war.id} className="flex items-center justify-between py-2 border-b-2 border-black/20 last:border-b-0">
                      <span className="text-xs font-bold truncate max-w-[80px] bg-black/20 px-2 py-1 rounded">{war.attacker.split(" ")[0]}</span>
                      <span className="text-xs font-black px-2 py-1 bg-white text-[#EF476F] border-[2px] border-black rounded-lg shadow-[0_2px_0_0_#000]">VS</span>
                      <span className="text-xs font-bold truncate max-w-[80px] text-right bg-black/20 px-2 py-1 rounded">{war.defender.split(" ")[0]}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Realm Travel */}
              <div className="block-panel bg-white p-3">
                <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-3">
                  <h4 className="text-sm font-black uppercase text-[#3E85E4] flex items-center gap-2">
                    <span className="text-xl">🌐</span> Realm Travel
                  </h4>
                  <span className="text-[10px] font-bold bg-gray-100 px-2 py-0.5 rounded-full border-[2px] border-black text-gray-500">
                    {(state.visitedRealms ?? []).length} visited
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-wider text-center bg-gray-50 p-2 rounded-xl border-[2px] border-dashed border-gray-200">
                    Costs 1 action · −3 health · resets explored locations
                  </p>
                  {(Object.keys(REALM_THEMES) as Realm[]).map(realm => {
                    const rt = REALM_THEMES[realm];
                    const isCurrent = state.realm === realm;
                    const wasVisited = (state.visitedRealms ?? []).includes(realm);
                    const isTarget = travelTarget === realm;
                    return (
                      <div key={realm} className={`flex items-center gap-3 p-3 rounded-xl border-[2px] border-black transition-all ${
                          isCurrent ? "bg-[#3E85E4] text-white shadow-[0_3px_0_0_#000]" : isTarget ? "bg-gray-100" : "bg-white hover:bg-gray-50 shadow-[0_3px_0_0_#000]"
                        }`}>
                        <span className="text-2xl bg-white border-[2px] border-black rounded-lg p-1 shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.1)]">{rt.particles[0]}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold truncate ${isCurrent ? "text-white" : "text-black"}`}>
                              {realm}
                            </span>
                            {isCurrent && <span className="text-[10px] px-1.5 py-0.5 rounded border-[2px] border-black font-black shrink-0 bg-[#FFD166] text-black shadow-[0_2px_0_0_#000]">HERE</span>}
                            {wasVisited && !isCurrent && <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">VISITED</span>}
                          </div>
                          <p className={`text-[10px] font-bold truncate ${isCurrent ? "text-white/80" : "text-gray-500"}`}>{rt.ambientDesc}</p>
                        </div>
                        {!isCurrent && (
                          isTarget ? (
                            <div className="flex gap-1.5 shrink-0">
                              <motion.button onClick={() => handleTravel(realm)}
                                disabled={actionsLeft === 0}
                                className="block-btn bg-[#06D6A0] text-black px-3 py-1.5 text-xs font-black shadow-[0_2px_0_0_#000] active:translate-y-[2px] active:shadow-none"
                                whileTap={{ scale: 0.95 }}>
                                GO
                              </motion.button>
                              <button onClick={() => setTravelTarget(null)}
                                className="block-btn bg-gray-200 text-gray-500 px-3 py-1.5 text-xs font-black shadow-[0_2px_0_0_#000] active:translate-y-[2px] active:shadow-none">
                                ✕
                              </button>
                            </div>
                          ) : (
                            <motion.button onClick={() => setTravelTarget(realm)}
                              disabled={actionsLeft === 0}
                              className="block-btn bg-white text-black px-3 py-1.5 text-xs font-black shadow-[0_2px_0_0_#000] active:translate-y-[2px] active:shadow-none border-[2px] border-black shrink-0"
                              whileTap={{ scale: 0.95 }}>
                              TRAVEL
                            </motion.button>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent world events */}
              <div className="block-panel bg-white p-3">
                <h4 className="text-sm font-black uppercase text-black mb-3 flex items-center gap-2 border-b-2 border-black pb-2">
                  <span className="text-xl">📜</span> World Chronicle
                </h4>
                {worldState.events.length === 0 ? (
                  <div className="text-center py-6 text-[10px] font-bold text-gray-400 bg-gray-50 rounded-xl border-[2px] border-dashed border-gray-200">
                    AGE UP TO TRIGGER WORLD EVENTS...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...worldState.events].reverse().slice(0, 12).map(ev => {
                      const color = {
                        war_declared: "#EF476F", war_ended: "#3E85E4", war_victory: "#FFD166",
                        power_ascension: "#F78C6B", realm_plague: "#06D6A0", golden_age: "#FFD166",
                        betrayal: "#9D4EDD", death: "#8898a8", alliance: "#06D6A0",
                        discovery: "#3E85E4", tyranny: "#F78C6B", exile: "#9D4EDD", duel: "#F78C6B",
                      }[ev.type] ?? "#8898a8";
                      return (
                        <div key={ev.id} className="flex items-start gap-3 p-2 rounded-xl border-[2px] border-black bg-gray-50">
                          <span className="text-2xl bg-white border-[2px] border-black rounded-lg p-1 shrink-0 shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.1)]">{ev.icon}</span>
                          <div className="flex-1 min-w-0 py-0.5">
                            <div className="text-xs font-bold truncate" style={{ color }}>{ev.title}</div>
                            <div className="text-[10px] font-bold text-gray-500 leading-snug mt-0.5">{ev.description}</div>
                          </div>
                          <span className="text-[10px] font-black text-white bg-black px-1.5 py-0.5 rounded border-[2px] border-black shrink-0 mt-1">YR {ev.year}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="text-center py-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase">The world evolves with every year you age.</p>
              </div>
            </div>
          )}
        </main>

        {/* ─── STAT BARS ──────────────────────────────────────── */}
        {/* ─── STAT BARS ──────────────────────────────────────── */}
        {/* ─── STAT BARS ──────────────────────────────────────── */}
        <div className="px-3 py-3 border-t-[3px] border-black dark:border-surface-variant bg-transparent space-y-2 shrink-0 shadow-[0_-4px_0_0_rgba(0,0,0,0.05)] relative z-10 transition-colors duration-300">
          {STAT_BAR_KEYS.map(k => {
            const val = state.stats[k];
            const barPct = Math.min(100, val);
            const overMax = val > 100;
            return (
              <div key={k} className="flex items-center gap-2">
                <span className="text-sm w-5 text-center shrink-0">{STAT_BAR_ICONS[k]}</span>
                <span className="text-[10px] font-bold uppercase text-gray-500 w-16 shrink-0 truncate">{k}</span>
                <div className="flex-1 h-3 border-[2px] border-black dark:border-surface-variant bg-gray-100 dark:bg-[#1e1e24] rounded-full overflow-hidden">
                  <motion.div className={`h-full ${STAT_BAR_COLORS[k]}`}
                    initial={false} animate={{ width: `${barPct}%` }}
                    transition={{ duration: 0.5 }} />
                </div>
                <span className={`text-[10px] font-black w-8 text-right shrink-0 ${overMax ? "text-[#FFD166]" : "text-on-surface dark:text-white"}`}>
                  {val}{overMax ? "" : "%"}
                </span>
              </div>
            );
          })}
        </div>

        {/* ─── BOTTOM NAV ─────────────────────────────────────── */}
        <nav className="bottom-nav flex items-center justify-between px-2 pb-5 pt-2 sticky bottom-0 z-20 shrink-0 w-full">
          <NavBtn icon="🏠" label="Life" active={tab === "life"} onClick={() => setTab("life")} />
          <NavBtn icon="💼" label="Career" active={tab === "job"} onClick={() => setTab("job")} />
          <NavBtn icon="💰" label="Assets" active={tab === "assets"} onClick={() => setTab("assets")} />
          <NavBtn icon="❤️" label="Bonds" active={tab === "bonds"} onClick={() => setTab("bonds")} />
          <NavBtn icon="🗺️" label="Map" active={tab === "map"} onClick={() => setTab("map")} />
          <NavBtn icon="⚡" label="Actions" active={tab === "activities"} onClick={() => setTab("activities")} />
        </nav>
      </div>

      {/* ─── CUTSCENE OVERLAY ────────────────────────────────── */}
      {state.cutscene && (
        <CutsceneOverlay
          cutscene={state.cutscene}
          onChoice={resolveCutscene}
        />
      )}

      {/* ─── NPC CHAT MODAL ──────────────────────────────────── */}
      <AnimatePresence>
        {chatNpc && (
          <NpcChat npc={chatNpc} gameState={state} onClose={() => setChatNpc(null)} />
        )}
      </AnimatePresence>

      {/* ─── EVENT MODAL ─────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && currentEvent && (
          <>
            <motion.div
              className="fixed inset-0 z-40 backdrop-blur-sm"
              style={{ background: `${theme.skyColor}cc` }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { clearEvent(); setShowModal(false); }}
            />
            <motion.div
              className="fixed inset-x-4 top-1/2 z-50 -translate-y-1/2 rounded-2xl border overflow-hidden"
              style={{
                background: theme.parchmentBg,
                borderColor: theme.accent,
                boxShadow: `0 0 80px ${theme.accentGlow}, 0 20px 60px rgba(0,0,0,0.9)`,
                maxWidth: 480, margin: "0 auto",
              }}
              initial={{ opacity: 0, scale: 0.9, y: "-40%" }}
              animate={{ opacity: 1, scale: 1, y: "-50%" }}
              exit={{ opacity: 0, scale: 0.9, y: "-40%" }}
              transition={{ type: "spring", damping: 20, stiffness: 280 }}>

              <div className="px-5 py-3 text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                style={{ background: `${theme.accent}25`, color: theme.accent, borderBottom: `1px solid ${theme.accent}40` }}>
                <span className="rune-pulse">{theme.particles[0]}</span>
                Age {state.age} · {currentEvent.category}
                <span className="ml-auto opacity-60">{currentEvent.rarity}</span>
              </div>

              <div className="px-5 pt-5 pb-4">
                <p className="font-serif text-base leading-relaxed text-foreground/90">
                  {currentEvent.narrative}
                </p>
              </div>

              <div className="px-5 pb-5 space-y-2">
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-widest">Choose your path</p>
                {currentEvent.choices.map((choice: import("@/lib/games/life-chronicle/engine/events").EventChoice, i: number) => (
                  <motion.button key={i} onClick={() => handleChoice(i)}
                    className="w-full text-left px-4 py-3.5 rounded-xl border transition-all"
                    style={{ borderColor: theme.borderColor, background: theme.cardBg }}
                    whileHover={{ borderColor: theme.accent, background: `${theme.accent}15`, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}>
                    <div className="flex items-start gap-3">
                      <span className="text-sm font-bold shrink-0 mt-0.5" style={{ color: theme.accent }}>
                        {["I","II","III","IV"][i]}
                      </span>
                      <div className="flex-1">
                        <div className="font-serif text-sm font-medium text-foreground">{choice.text}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{choice.effectText}</div>
                        {choice.unlockPath && (
                          <div className="text-xs font-medium mt-1" style={{ color: MYSTICAL_PATH_COLORS[choice.unlockPath] ?? theme.accent }}>
                            ⚡ Unlocks {MYSTICAL_PATH_NAMES[choice.unlockPath]} path
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── QUIT LIFE MODAL ─────────────────────────────────── */}
      <AnimatePresence>
        {showQuitModal && (
          <>
            <motion.div
              className="fixed inset-0 z-40 backdrop-blur-sm"
              style={{ background: "rgba(0,0,0,0.8)" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowQuitModal(false)}
            />
            <motion.div
              className="fixed inset-x-6 top-1/2 z-50 rounded-2xl border overflow-hidden"
              style={{
                background: "hsl(220,25%,8%)",
                borderColor: "rgba(248,113,113,0.5)",
                boxShadow: "0 0 60px rgba(248,113,113,0.2), 0 20px 60px rgba(0,0,0,0.9)",
                maxWidth: 440, margin: "0 auto",
              }}
              initial={{ opacity: 0, scale: 0.9, y: "-40%" }}
              animate={{ opacity: 1, scale: 1, y: "-50%" }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 22, stiffness: 300 }}>

              <div className="px-5 py-3 text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", borderBottom: "1px solid rgba(248,113,113,0.2)" }}>
                ✗ End This Chapter
              </div>

              <div className="px-6 pt-5 pb-4">
                <p className="font-serif text-base leading-relaxed text-foreground/90">
                  You stand at the edge of your story, and consider stepping away from this life entirely.
                </p>
                <div className="mt-4 p-3 rounded-lg text-sm"
                  style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Current Age</span>
                    <span>{state.age} years</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Legacy Score</span>
                    <span>{state.legacyScore.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Achievements</span>
                    <span>{state.achievements.length}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  This cannot be undone. Your life will end here.
                </p>
              </div>

              <div className="px-6 pb-6 grid grid-cols-2 gap-3">
                <button onClick={() => setShowQuitModal(false)}
                  className="h-12 rounded-xl border font-serif font-medium transition-all hover:bg-white/5"
                  style={{ borderColor: "rgba(255,255,255,0.15)", color: "hsl(240,5%,70%)" }}>
                  Continue Living
                </button>
                <button onClick={handleQuitLife}
                  className="h-12 rounded-xl font-serif font-bold transition-all hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg, #991b1b, #7f1d1d)",
                    color: "#fca5a5",
                    boxShadow: "0 4px 20px rgba(153,27,27,0.5)",
                  }}>
                  End This Life
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── CLOUD SAVES MODAL ───────────────────────────────────── */}
      <AnimatePresence>
        {showSaves && (
          <SaveManager
            onClose={() => setShowSaves(false)}
            onLoad={() => navigate("game")}
          />
        )}
      </AnimatePresence>

      {/* ─── AI ORACLE ─────────────────────────────────────────── */}
      <AiGuide theme={theme} eventNarrative={currentEvent?.narrative} />
    </div>
  );
}

interface NavBtnProps {
  icon: string; label: string; active: boolean; onClick: () => void;
}
function NavBtn({ icon, label, active, onClick }: NavBtnProps) {
  return (
    <button onClick={onClick} className={`nav-item flex-1 ${active ? 'active' : ''}`}>
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-[10px] font-bold text-black uppercase">{label}</span>
    </button>
  );
}
