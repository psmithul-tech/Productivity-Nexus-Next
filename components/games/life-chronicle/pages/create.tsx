import { useState } from "react";
import { useRouter } from "../App";
import { Input } from "@/components/games/life-chronicle/ui/input";
import { useGame } from "@/lib/games/life-chronicle/engine/GameContext";
import { Bloodline, Gender, Realm, RomanceLevel, OUTFIT_STYLES, ACCESSORY_OPTIONS, OutfitStyle, Accessory } from "@/lib/games/life-chronicle/engine/types";
import { getSpriteSvg } from "@/lib/games/life-chronicle/engine/sprite";
import { getRealmTheme, REALM_THEMES } from "@/lib/games/life-chronicle/engine/realmThemes";
import { TALENT_LIST, TALENTS, Talent } from "@/lib/games/life-chronicle/engine/talents";
import { motion, AnimatePresence } from "framer-motion";
import { CLANS, CLAN_TIERS, type ClanDef, type ClanTier } from "@/lib/games/life-chronicle/engine/clanSystem";
import { SCENARIOS } from "@/lib/games/life-chronicle/engine/scenarios";

const BLOODLINES: { value: Bloodline; icon: string; desc: string; color: string }[] = [
  { value: "Common",    icon: "⚔",  desc: "Balanced. Adaptable. Underestimated.",        color: "#8898a8" },
  { value: "Draconic",  icon: "🐉", desc: "Strength and dragonfire in your veins.",       color: "#88bb70" },
  { value: "Elven",     icon: "✦",  desc: "Ancient wisdom, centuries of memory.",         color: "#d8c840" },
  { value: "Infernal",  icon: "🔥", desc: "Power at a terrible price. Always.",           color: "#e07060" },
  { value: "Celestial", icon: "✵",  desc: "Light-touched. Faith abundantly rewarded.",   color: "#f0d040" },
  { value: "Fae",       icon: "🌸", desc: "Luck and chaos forever intertwined.",          color: "#e8b8ff" },
  { value: "Werewolf",  icon: "🐺", desc: "Raw primal strength. Fierce pack loyalty.",   color: "#ddb870" },
  { value: "Undead",    icon: "💀", desc: "Death is merely an inconvenience.",            color: "#a8c4c0" },
  { value: "Void",      icon: "◈",  desc: "Magic that defies all comprehension.",         color: "#8040ff" },
  { value: "Dwarvish",  icon: "⛏",  desc: "Stone-hard. Forged for wealth.",              color: "#d89050" },
  { value: "Orcish",    icon: "🪓", desc: "War-born and feared across all realms.",       color: "#70b040" },
  { value: "Merfolk",   icon: "🌊", desc: "Deep charisma of the ocean currents.",         color: "#70d8d0" },
];

const ROMANCE_OPTIONS: { value: RomanceLevel; icon: string; label: string; desc: string; color: string }[] = [
  { value: "none",     icon: "⚔", label: "No Romance",  desc: "A life of ambition, power, and legacy. Love is a distraction you can't afford.", color: "#8898a8" },
  { value: "mild",     icon: "❤", label: "Romance",      desc: "Love finds you. Courtship, heartbreak, proposals — the full spectrum of the heart.", color: "#e88098" },
  { value: "explicit", icon: "🔥", label: "Explicit",    desc: "All of the above — plus explicit intimate scenes. For mature storytellers only.", color: "#e06040" },
];

const MYSTICAL_PATH_OPTIONS = [
  { value: "none",         icon: "◦",  label: "No Path",       color: "#8898a8" },
  { value: "cultivation",  icon: "⚡",  label: "Qi Cultivation", color: "#f0a830" },
  { value: "arcane_magic", icon: "✦",   label: "Arcane Magic",   color: "#8080f0" },
  { value: "sacred_arts",  icon: "✵",   label: "Sacred Arts",    color: "#f0d060" },
  { value: "rune_smith",   icon: "⬡",   label: "Rune Smith",     color: "#60c0a0" },
];

const REALM_LIST = Object.values(REALM_THEMES);
const GENDERS: Gender[] = ["Male", "Female", "Other"];

type Step = "mode" | "realm" | "character" | "scenario" | "clan" | "customize" | "talent" | "romance";

const ALL_STAT_KEYS = ["health","happiness","relationships","education","career","wealth","charisma","intelligence","strength","magic","reputation","faith","infamy","luck"] as const;

const CLAN_TIERS_LIST: ClanTier[] = ["Wanderer", "Minor", "Major", "Grand", "Royal", "Imperial", "Legendary"];

export default function Create() {
  const { navigate } = useRouter();
  const { startNewGame } = useGame();

  const [isBossMode, setBossMode]       = useState(false);
  const [name, setName]                 = useState("");
  const [gender, setGender]             = useState<Gender>("Male");
  const [bloodline, setBloodline]       = useState<Bloodline>("Common");
  const [realm, setRealm]               = useState<Realm>("Mundus");
  const [romanceLevel, setRomance]      = useState<RomanceLevel>("mild");
  const [talent, setTalent]             = useState<Talent>("Average");
  const [outfitStyle, setOutfitStyle]   = useState<OutfitStyle>("warrior");
  const [accessory, setAccessory]       = useState<Accessory>("none");
  const [hairStyle, setHairStyle]       = useState("short");
  const [hairColor, setHairColor]       = useState("#3a2010");
  const [eyeStyle, setEyeStyle]         = useState("round");
  const [eyeColor, setEyeColor]         = useState("#4a6888");
  const [skinColor, setSkinColor]       = useState("#e8b98a");
  const [bodyType, setBodyType]         = useState("average");
  const [facialHair, setFacialHair]     = useState("none");
  const [familyName, setFamilyName]     = useState("");
  const [bossMysticalPath, setBossMysticalPath] = useState<"none"|"cultivation"|"arcane_magic"|"sacred_arts"|"rune_smith">("none");
  const [bossClan, setBossClan]         = useState<string>("None");
  const [bossStats, setBossStats]       = useState<Partial<Record<typeof ALL_STAT_KEYS[number], number>>>({});
  const [clanTierFilter, setClanTierFilter] = useState<ClanTier | "all">("all");
  const [scenarioId, setScenarioId]     = useState<string>("commoner");
  const [step, setStep]                 = useState<Step>("mode");

  const selectedBL = BLOODLINES.find(b => b.value === bloodline)!;
  const realmTheme = getRealmTheme(realm);
  const talentDef  = TALENTS[talent];
  const selectedClanDef: ClanDef | undefined = CLANS.find(c => c.name === bossClan);

  const handleStart = () => {
    if (!name.trim()) return;
    startNewGame(name.trim(), gender, realm, bloodline, romanceLevel, {
      talent,
      familyName: familyName.trim() || undefined,
      outfitStyle,
      accessory,
      appearance: { hairStyle, hairColor, eyeStyle, eyeColor, skinColor, bodyType, facialHair },
      isBossMode,
      bossMysticalPath: isBossMode ? bossMysticalPath as any : undefined,
      clan: isBossMode ? bossClan : undefined,
      bossStats: isBossMode && Object.keys(bossStats).length > 0 ? bossStats as any : undefined,
      scenario: scenarioId,
    });
    navigate("game");
  };

  const getStepOrder = (): Step[] => {
    if (isBossMode) return ["mode", "realm", "character", "scenario", "clan", "customize", "talent", "romance"];
    return ["mode", "realm", "character", "scenario", "customize", "talent", "romance"];
  };

  const backStep = () => {
    const order = getStepOrder();
    const idx = order.indexOf(step);
    if (idx > 0) setStep(order[idx - 1]);
    else navigate("home");
  };

  const stepLabels: Step[] = getStepOrder();

  return (
    <div className="h-full w-full flex-1 relative overflow-y-auto custom-scrollbar" style={{ background: "transparent" }}>
      {/* Background is now handled by .game-wrapper in life-chronicle.css */}

      <div className="relative z-10 min-h-full flex flex-col lg:flex-row items-start justify-center p-4 pt-6 gap-8 w-full max-w-[1400px] mx-auto">
        
        {/* LEFT COLUMN: SVG Preview (Desktop Only) */}
        {["character", "scenario", "clan", "customize", "talent", "romance"].includes(step) && (
          <div className="hidden lg:flex w-1/3 sticky top-10 flex-col items-center p-6 rounded-2xl border-[3px] shadow-[4px_4px_0_0_#000] z-20" 
               style={{ background: "var(--ca-panel)", borderColor: "var(--ca-border)" }}>
            <h2 className="font-serif font-bold text-xl mb-4" style={{ color: realmTheme.accent }}>Your Avatar</h2>
            <div className="w-full aspect-[2/3] relative">
              <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle, ${selectedBL.color}30 0%, transparent 70%)` }} />
              <div className="sprite-breathe w-full h-full"
                dangerouslySetInnerHTML={{ __html: getSpriteSvg(bloodline, gender, 20, 0, outfitStyle, accessory, { hairStyle, hairColor, eyeStyle, eyeColor, skinColor, bodyType, facialHair }) }} />
            </div>
            <div className="mt-4 font-bold text-center">
              <div className="text-lg">{name || "Unknown"}</div>
              <div className="text-xs text-muted-foreground">{bloodline} · {gender}</div>
            </div>
          </div>
        )}

        {/* RIGHT COLUMN: Wizard Steps */}
        <div className="w-full flex-1">

          <button onClick={backStep}
            className="text-muted-foreground text-sm mb-4 flex items-center gap-1 hover:text-foreground transition-colors">
            ← {step === "romance" ? "Back" : step === "talent" ? "Back" : step === "customize" ? "Back" : step === "character" ? "Change Realm" : step === "realm" ? "Back" : "Back"}
          </button>

          {/* Step indicator */}
          <div className="flex gap-1.5 mb-5">
            {stepLabels.map(s => (
              <div key={s} className="flex-1 h-1 rounded-full transition-all"
                style={{
                  background: stepLabels.indexOf(s) <= stepLabels.indexOf(step)
                    ? realmTheme.accent
                    : `${realmTheme.accent}30`,
                }} />
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* ── STEP 0: MODE SELECT ──────────────────────────────── */}
            {step === "mode" && (
              <motion.div key="mode"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>

                <div className="mb-8">
                  <h1 className="font-serif text-4xl font-bold mb-2 text-glow-amber"
                    style={{ color: "#F4AF25" }}>
                    Forge Your Destiny
                  </h1>
                  <p className="text-sm italic font-serif" style={{ color: "#9e8f7a" }}>
                    Every soul begins with a choice.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Normal Life */}
                  <motion.button
                    onClick={() => { setBossMode(false); setStep("realm"); }}
                    className="w-full p-5 rounded-2xl border-[3px] text-left transition-all relative overflow-hidden"
                    style={{ background: "var(--ca-panel-dark)", borderColor: "var(--ca-border)", boxShadow: "0 4px 0 0 var(--ca-border)" }}
                    whileHover={{ transform: "translateY(2px)", boxShadow: "0 2px 0 0 var(--ca-border)" }}
                    whileTap={{ transform: "translateY(4px)", boxShadow: "0 0 0 0 var(--ca-border)" }}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border-[2px]"
                        style={{ background: "var(--ca-panel)", borderColor: "var(--ca-border)" }}>
                        📖
                      </div>
                      <div>
                        <div className="font-serif font-bold text-xl mb-0.5 text-white">Normal Life</div>
                        <div className="text-xs text-gray-400">
                          Born into the world. Your fate shaped by choices, chance, and time.
                        </div>
                      </div>
                      <div className="ml-auto text-xl shrink-0 text-gray-500">→</div>
                    </div>
                  </motion.button>

                  {/* Boss Mode */}
                  <motion.button
                    onClick={() => { setBossMode(true); setStep("realm"); }}
                    className="w-full p-5 rounded-2xl border-[3px] text-left transition-all relative overflow-hidden"
                    style={{ background: "var(--ca-panel-dark)", borderColor: "var(--ca-yellow)", boxShadow: "0 4px 0 0 var(--ca-yellow)" }}
                    whileHover={{ transform: "translateY(2px)", boxShadow: "0 2px 0 0 var(--ca-yellow)" }}
                    whileTap={{ transform: "translateY(4px)", boxShadow: "0 0 0 0 var(--ca-yellow)" }}>
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full font-bold text-[10px] uppercase border-[2px]"
                      style={{ background: "var(--ca-yellow)", color: "var(--ca-border)", borderColor: "var(--ca-border)" }}>
                      BOSS
                    </div>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border-[2px]"
                        style={{ background: "var(--ca-panel)", borderColor: "var(--ca-yellow)" }}>
                        👑
                      </div>
                      <div>
                        <div className="font-serif font-bold text-xl mb-0.5" style={{ color: "var(--ca-yellow)" }}>Boss Mode</div>
                        <div className="text-xs text-gray-400">
                          Enter the world with extraordinary power. Rule from day one.
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap mt-2">
                      {["⚡ Max power", "✦ Mystical path", "🏛 Choose clan", "🧠 Pick talent"].map(f => (
                        <span key={f} className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border-[2px]"
                          style={{ background: "transparent", color: "var(--ca-yellow)", borderColor: "var(--ca-yellow)" }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 1: REALM SELECTION ─────────────────────────── */}
            {step === "realm" && (
              <motion.div key="realm"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>

                <div className="flex items-center gap-2 mb-1">
                  {isBossMode && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(255,215,0,0.2)", color: "#ffd700" }}>BOSS</span>}
                  <h1 className="font-serif text-3xl font-bold" style={{ color: realmTheme.accent }}>Choose Your Realm</h1>
                </div>
                <p className="text-muted-foreground text-sm mb-5">Where your story begins shapes everything.</p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {REALM_LIST.map(r => {
                    const isSelected = realm === r.name;
                    return (
                      <motion.button key={r.name} onClick={() => setRealm(r.name)}
                        className="relative rounded-xl border-[3px] p-4 text-left transition-all overflow-hidden"
                        style={{
                          background: isSelected ? `${r.accent}18` : r.cardBg,
                          borderColor: isSelected ? r.accent : r.borderColor,
                          boxShadow: isSelected ? `0 4px 0 0 ${r.accent}` : "0 4px 0 0 var(--ca-border)",
                          transform: isSelected ? "translateY(-2px)" : "none",
                        }}
                        whileHover={!isSelected ? { transform: "translateY(-1px)", boxShadow: "0 5px 0 0 var(--ca-border)" } : {}}
                        whileTap={{ transform: "translateY(2px)", boxShadow: "0 2px 0 0 var(--ca-border)" }}>
                        {isSelected && (
                          <motion.div
                            className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ background: r.accent, color: "#000" }}
                            initial={{ scale: 0 }} animate={{ scale: 1 }}>✓</motion.div>
                        )}
                        <div className="text-xl mb-1">{r.particles[0]}</div>
                        <div className="font-serif font-bold text-sm" style={{ color: isSelected ? r.accent : "inherit" }}>{r.name}</div>
                        <div className="text-xs text-muted-foreground mt-1 leading-tight">{r.ambientDesc}</div>
                      </motion.button>
                    );
                  })}
                </div>

                <motion.button onClick={() => setStep("character")}
                  className="mt-6 w-full h-14 rounded-xl border-[3px] font-serif text-xl font-bold transition-all"
                  style={{
                    background: realmTheme.accent,
                    borderColor: "var(--ca-border)",
                    color: "#000",
                    boxShadow: "0 4px 0 0 var(--ca-border)",
                  }}
                  whileHover={{ transform: "translateY(2px)", boxShadow: "0 2px 0 0 var(--ca-border)" }}
                  whileTap={{ transform: "translateY(4px)", boxShadow: "0 0 0 0 var(--ca-border)" }}>
                  Enter {realm} →
                </motion.button>
              </motion.div>
            )}

            {/* ── STEP 2: CHARACTER CREATION ──────────────────────── */}
            {step === "character" && (
              <motion.div key="character"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>

                <div className="flex items-center gap-2 mb-5">
                  <span className="text-xl">{realmTheme.particles[0]}</span>
                  <div>
                    <h1 className="font-serif text-2xl font-bold" style={{ color: realmTheme.accent }}>
                      Forge Your Destiny
                    </h1>
                    <p className="text-xs text-muted-foreground">{realm} · {realmTheme.ambientDesc}</p>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Name */}
                  <div>
                    <label className="text-sm font-medium block mb-2">Name</label>
                    <Input value={name} onChange={e => setName(e.target.value)}
                      placeholder="Enter a name..."
                      className="h-12 text-base bg-card/80 border-[3px] border-black focus:border-black focus:ring-0 shadow-[0_3px_0_0_#000]"
                      style={{ background: "var(--ca-panel)", color: "var(--ca-border)" }}
                      data-testid="input-name" />
                  </div>

                  {/* Family Name */}
                  <div>
                    <label className="text-sm font-medium block mb-2">Dynasty Name <span className="text-muted-foreground text-xs">(optional)</span></label>
                    <Input value={familyName} onChange={e => setFamilyName(e.target.value)}
                      placeholder="e.g. House Ashford, Clan Stonehaven..."
                      className="h-11 text-sm bg-card/80 border-[3px] border-black focus:border-black focus:ring-0 shadow-[0_3px_0_0_#000]"
                      style={{ background: "var(--ca-panel)", color: "var(--ca-border)" }} />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="text-sm font-medium block mb-2">Gender</label>
                    <div className="flex gap-2">
                      {GENDERS.map(g => (
                        <button key={g} onClick={() => setGender(g)}
                          className="flex-1 h-11 rounded-xl border-[3px] text-sm font-bold transition-all"
                          style={{
                            background: gender === g ? realmTheme.accent : "var(--ca-panel)",
                            borderColor: "var(--ca-border)",
                            color: gender === g ? "#000" : "var(--ca-border)",
                            boxShadow: gender === g ? "none" : "0 3px 0 0 var(--ca-border)",
                            transform: gender === g ? "translateY(3px)" : "none",
                          }}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bloodline */}
                  <div>
                    <label className="text-sm font-medium block mb-2">Bloodline</label>
                    <div className="grid grid-cols-3 gap-2">
                      {BLOODLINES.map(b => (
                        <motion.button key={b.value} onClick={() => setBloodline(b.value)}
                          className="flex flex-col items-center gap-1 px-2 py-3 rounded-xl border-[3px] text-center transition-all"
                          style={{
                            background: bloodline === b.value ? `${b.color}30` : "var(--ca-panel)",
                            borderColor: bloodline === b.value ? b.color : "var(--ca-border)",
                            boxShadow: bloodline === b.value ? `0 4px 0 0 ${b.color}` : "0 4px 0 0 var(--ca-border)",
                            transform: bloodline === b.value ? "translateY(-2px)" : "none",
                          }}
                          whileTap={{ transform: "translateY(2px)" }}>
                          <span className="text-xl">{b.icon}</span>
                          <span className="text-xs font-serif font-bold" style={{ color: b.color }}>{b.value}</span>
                        </motion.button>
                      ))}
                    </div>
                    {selectedBL && (
                      <p className="text-xs mt-2 pl-1 italic text-center" style={{ color: selectedBL.color }}>
                        {selectedBL.desc}
                      </p>
                    )}
                  </div>

                  {/* Boss Mode: Mystical Path */}
                  {isBossMode && (
                    <div>
                      <label className="text-sm font-medium block mb-2">
                        <span style={{ color: "#ffd700" }}>⚡ Starting Mystical Path</span>
                        <span className="text-muted-foreground text-xs ml-2">(Boss Mode)</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {MYSTICAL_PATH_OPTIONS.map(p => (
                          <button key={p.value} onClick={() => setBossMysticalPath(p.value as any)}
                            className="flex flex-col items-center gap-1 px-2 py-3 rounded-xl border text-center transition-all"
                            style={{
                              background: bossMysticalPath === p.value ? `${p.color}18` : "transparent",
                              borderColor: bossMysticalPath === p.value ? p.color : realmTheme.borderColor,
                            }}>
                            <span className="text-lg">{p.icon}</span>
                            <span className="text-xs font-medium" style={{ color: p.color }}>{p.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sprite Preview */}
                <div className="mt-6 flex flex-col items-center gap-3">
                  <div className="relative flex items-center justify-center" style={{ width: 100, height: 130 }}>
                    <div className="absolute inset-0 rounded-full"
                      style={{ background: `radial-gradient(circle, ${selectedBL.color}30 0%, transparent 70%)` }} />
                    <div className="sprite-breathe" style={{ width: 88, height: 120 }}
                      dangerouslySetInnerHTML={{ __html: getSpriteSvg(bloodline, gender, 20, 0, outfitStyle, accessory) }} />
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full border"
                    style={{ borderColor: `${realmTheme.accent}40`, background: `${realmTheme.accent}10` }}>
                    <span style={{ color: selectedBL.color }}>{selectedBL.icon}</span>
                    <span className="font-serif font-medium text-foreground text-sm">{name || "Unknown"}</span>
                    <span className="text-muted-foreground text-xs">·</span>
                    <span className="text-xs" style={{ color: selectedBL.color }}>{bloodline}</span>
                    <span className="text-muted-foreground text-xs">·</span>
                    <span className="text-xs" style={{ color: realmTheme.accent }}>{realm}</span>
                  </div>
                </div>

                <motion.button
                  onClick={() => name.trim() && setStep("scenario")}
                  disabled={!name.trim()}
                  className="mt-6 w-full h-14 rounded-xl border-[3px] font-serif text-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  style={{
                    background: name.trim() ? realmTheme.accent : "var(--ca-panel)",
                    borderColor: "var(--ca-border)",
                    color: name.trim() ? "#000" : "gray",
                    boxShadow: name.trim() ? "0 4px 0 0 var(--ca-border)" : "none",
                  }}
                  whileHover={name.trim() ? { transform: "translateY(2px)", boxShadow: "0 2px 0 0 var(--ca-border)" } : {}}
                  whileTap={name.trim() ? { transform: "translateY(4px)", boxShadow: "0 0 0 0 var(--ca-border)" } : {}}>
                  Continue →
                </motion.button>
                <div className="h-8" />
              </motion.div>
            )}

            {/* ── SCENARIO SELECTION ────────────────────────── */}
            {step === "scenario" && (
              <motion.div key="scenario"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>

                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">📜</span>
                  <h1 className="font-serif text-2xl font-bold" style={{ color: realmTheme.accent }}>Starting Scenario</h1>
                </div>
                <p className="text-muted-foreground text-sm mb-4">
                  Every soul begins with a story. Select your background.
                </p>

                <div className="space-y-3">
                  {SCENARIOS.map(sc => {
                    const isSelected = scenarioId === sc.id;
                    return (
                      <motion.button key={sc.id} onClick={() => setScenarioId(sc.id)}
                        className="w-full p-4 rounded-xl border-[3px] text-left transition-all relative overflow-hidden"
                        style={{
                          background: isSelected ? `${realmTheme.accent}30` : "var(--ca-panel)",
                          borderColor: "var(--ca-border)",
                          boxShadow: isSelected ? `0 4px 0 0 ${realmTheme.accent}` : "0 4px 0 0 var(--ca-border)",
                          transform: isSelected ? "translateY(-2px)" : "none",
                        }}
                        whileHover={!isSelected ? { transform: "translateY(-1px)", boxShadow: "0 5px 0 0 var(--ca-border)" } : {}}
                        whileTap={{ transform: "translateY(2px)", boxShadow: "0 2px 0 0 var(--ca-border)" }}>
                        {isSelected && (
                          <motion.div
                            className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ background: realmTheme.accent, color: "#000" }}
                            initial={{ scale: 0 }} animate={{ scale: 1 }}>✓</motion.div>
                        )}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-serif font-bold text-base" style={{ color: isSelected ? realmTheme.accent : "inherit" }}>{sc.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded border border-gray-600 bg-gray-800 text-gray-300 font-mono">
                            {sc.legacyMultiplier}x Legacy
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{sc.description}</p>
                      </motion.button>
                    );
                  })}
                </div>

                <motion.button onClick={() => setStep(isBossMode ? "clan" : "customize")}
                  className="mt-6 w-full h-14 rounded-xl border-[3px] font-serif text-xl font-bold transition-all"
                  style={{ background: realmTheme.accent, borderColor: "var(--ca-border)", color: "#000", boxShadow: "0 4px 0 0 var(--ca-border)" }}
                  whileHover={{ transform: "translateY(2px)", boxShadow: "0 2px 0 0 var(--ca-border)" }}
                  whileTap={{ transform: "translateY(4px)", boxShadow: "0 0 0 0 var(--ca-border)" }}>
                  Continue →
                </motion.button>
                <div className="h-8" />
              </motion.div>
            )}

            {/* ── CLAN SELECTION (Boss Mode only) ──────────────────── */}
            {step === "clan" && (
              <motion.div key="clan"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>

                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(255,215,0,0.2)", color: "#ffd700" }}>BOSS</span>
                  <h1 className="font-serif text-2xl font-bold" style={{ color: "#ffd700" }}>Choose Your Clan</h1>
                </div>
                <p className="text-muted-foreground text-sm mb-4">
                  Your clan determines your birthright, starting bonuses, and place in the world.
                </p>

                {/* Tier filter tabs */}
                <div className="flex gap-1.5 flex-wrap mb-4">
                  {(["all", ...CLAN_TIERS_LIST] as const).map(tier => {
                    const tierDef = tier !== "all" ? CLAN_TIERS[tier] : null;
                    const isSelected = clanTierFilter === tier;
                    return (
                      <button key={tier} onClick={() => setClanTierFilter(tier as any)}
                        className="text-xs px-2.5 py-1 rounded-full transition-all font-bold border-[2px]"
                        style={{
                          background: isSelected ? (tierDef?.color ?? realmTheme.accent) : "var(--ca-panel)",
                          color: isSelected ? "#000" : (tierDef?.color ?? "var(--ca-border)"),
                          borderColor: "var(--ca-border)",
                          boxShadow: isSelected ? "none" : "0 2px 0 0 var(--ca-border)",
                          transform: isSelected ? "translateY(2px)" : "none",
                        }}>
                        {tier === "all" ? "All" : tier}
                      </button>
                    );
                  })}
                </div>

                {/* Random clan button */}
                <motion.button
                  onClick={() => {
                    const pool = CLANS.filter(c => c.name !== "None" && (clanTierFilter === "all" || c.tier === clanTierFilter));
                    if (pool.length > 0) setBossClan(pool[Math.floor(Math.random() * pool.length)].name);
                  }}
                  className="w-full py-2.5 rounded-xl border-[3px] text-sm font-bold mb-4 transition-all"
                  style={{ borderColor: "var(--ca-border)", color: "#000", background: "var(--ca-yellow)", boxShadow: "0 3px 0 0 var(--ca-border)" }}
                  whileHover={{ transform: "translateY(1px)", boxShadow: "0 2px 0 0 var(--ca-border)" }}
                  whileTap={{ transform: "translateY(3px)", boxShadow: "0 0 0 0 var(--ca-border)" }}>
                  🎲 Random Clan
                </motion.button>

                {/* Clan list */}
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {CLANS
                    .filter(c => clanTierFilter === "all" || c.tier === clanTierFilter)
                    .map(clan => {
                      const tierDef = CLAN_TIERS[clan.tier];
                      const isSelected = bossClan === clan.name;
                      return (
                        <motion.button key={clan.name} onClick={() => setBossClan(clan.name)}
                          className="w-full p-3 rounded-xl border-[3px] text-left transition-all relative overflow-hidden"
                          style={{
                            background: isSelected ? `${tierDef.color}30` : "var(--ca-panel)",
                            borderColor: "var(--ca-border)",
                            boxShadow: isSelected ? `0 4px 0 0 ${tierDef.color}` : "0 4px 0 0 var(--ca-border)",
                            transform: isSelected ? "translateY(-2px)" : "none",
                          }}
                          whileHover={!isSelected ? { transform: "translateY(-1px)", boxShadow: "0 5px 0 0 var(--ca-border)" } : {}}
                          whileTap={{ transform: "translateY(2px)", boxShadow: "0 2px 0 0 var(--ca-border)" }}>
                          {isSelected && (
                            <motion.div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
                              style={{ background: tierDef.color, color: "#000" }}
                              initial={{ scale: 0 }} animate={{ scale: 1 }}>✓</motion.div>
                          )}
                          <div className="flex items-start gap-2.5">
                            <span className="text-xl mt-0.5 shrink-0">{clan.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-serif font-bold text-sm" style={{ color: isSelected ? tierDef.color : "inherit" }}>{clan.name}</span>
                                <span className="text-xs px-1.5 py-0.5 rounded"
                                  style={{ background: `${tierDef.color}18`, color: tierDef.color, border: `1px solid ${tierDef.color}30` }}>
                                  {clan.tier}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{clan.desc}</p>
                              {/* Bonuses */}
                              <div className="flex gap-2 flex-wrap mt-1.5">
                                {clan.wealthBonus > 0 && (
                                  <span className="text-xs text-emerald-400">+{clan.wealthBonus} wealth</span>
                                )}
                                {Object.entries(clan.statBonus).slice(0, 3).map(([k, v]) => (
                                  <span key={k} className="text-xs" style={{ color: tierDef.color }}>+{v} {k}</span>
                                ))}
                                {clan.bloodlineAffinity && (
                                  <span className="text-xs text-muted-foreground">Affinity: {clan.bloodlineAffinity.join(", ")}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                </div>

                <motion.button onClick={() => setStep("customize")}
                  className="mt-5 w-full h-14 rounded-xl border-[3px] font-serif text-xl font-bold transition-all"
                  style={{ background: "var(--ca-yellow)", borderColor: "var(--ca-border)", color: "#000", boxShadow: "0 4px 0 0 var(--ca-border)" }}
                  whileHover={{ transform: "translateY(2px)", boxShadow: "0 2px 0 0 var(--ca-border)" }}
                  whileTap={{ transform: "translateY(4px)", boxShadow: "0 0 0 0 var(--ca-border)" }}>
                  {bossClan && bossClan !== "None" ? `Join ${bossClan} →` : "Skip Clan →"}
                </motion.button>
                <div className="h-8" />
              </motion.div>
            )}

            {/* ── STEP 3: SPRITE CUSTOMIZATION ─────────────────────── */}
            {step === "customize" && (
              <motion.div key="customize"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>

                <h1 className="font-serif text-2xl font-bold mb-1" style={{ color: realmTheme.accent }}>
                  Appearance
                </h1>
                <p className="text-muted-foreground text-sm mb-5">How does the world see you?</p>

                {/* Live preview (Mobile only) */}
                <div className="flex lg:hidden justify-center mb-6">
                  <div className="relative" style={{ width: 100, height: 130 }}>
                    <div className="absolute inset-0 rounded-full"
                      style={{ background: `radial-gradient(circle, ${selectedBL.color}30 0%, transparent 70%)` }} />
                    <div className="sprite-breathe" style={{ width: 88, height: 120 }}
                      dangerouslySetInnerHTML={{ __html: getSpriteSvg(bloodline, gender, 20, 0, outfitStyle, accessory, { hairStyle, hairColor, eyeStyle, eyeColor, skinColor, bodyType, facialHair }) }} />
                  </div>
                </div>

                {/* Body & Skin */}
                <div className="mb-5">
                  <label className="text-sm font-medium block mb-2">Body Type</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                    {["average", "slender", "muscular", "stout", "tail_fin"].map(bt => (
                      <button key={bt} onClick={() => setBodyType(bt)}
                        className={`px-3 py-1.5 rounded-lg border-[2px] font-bold text-xs uppercase ${bodyType === bt ? "bg-[#3E85E4] text-white border-black shadow-[0_2px_0_0_#000]" : "bg-white text-black border-black/20"}`}>
                        {bt.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-5">
                  <label className="text-sm font-medium block mb-2">Skin Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {["#e8b98a", "#f0e4d0", "#c09050", "#5a8a4a", "#c04040", "#2a1a50", "#30a8a0", "#7a9090"].map(col => (
                      <button key={col} onClick={() => setSkinColor(col)}
                        className={`w-8 h-8 rounded-full border-[3px] ${skinColor === col ? "border-white shadow-[0_0_0_2px_#000]" : "border-black"}`}
                        style={{ backgroundColor: col }} />
                    ))}
                  </div>
                </div>

                {/* Hair */}
                <div className="mb-5">
                  <label className="text-sm font-medium block mb-2">Hair Style</label>
                  <div className="flex gap-2 flex-wrap">
                    {["short", "long", "spiky", "bald", "ponytail", "curly", "braids"].map(hs => (
                      <button key={hs} onClick={() => setHairStyle(hs)}
                        className={`px-3 py-1.5 rounded-lg border-[2px] font-bold text-xs uppercase ${hairStyle === hs ? "bg-[#FFD166] text-black border-black shadow-[0_2px_0_0_#000]" : "bg-white text-black border-black/20"}`}>
                        {hs}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-5">
                  <label className="text-sm font-medium block mb-2">Hair Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {["#3a2010", "#d8c840", "#c030e0", "#1a3010", "#100808", "#f0d040", "#006880", "#282020", "#ffffff"].map(col => (
                      <button key={col} onClick={() => setHairColor(col)}
                        className={`w-8 h-8 rounded-full border-[3px] ${hairColor === col ? "border-white shadow-[0_0_0_2px_#000]" : "border-black"}`}
                        style={{ backgroundColor: col }} />
                    ))}
                  </div>
                </div>

                {/* Eyes */}
                <div className="mb-5 flex gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium block mb-2">Eye Style</label>
                    <div className="flex gap-2 flex-wrap">
                      {["round", "slit", "hollow"].map(es => (
                        <button key={es} onClick={() => setEyeStyle(es)}
                          className={`px-3 py-1.5 rounded-lg border-[2px] font-bold text-xs uppercase ${eyeStyle === es ? "bg-[#06D6A0] text-black border-black shadow-[0_2px_0_0_#000]" : "bg-white text-black border-black/20"}`}>
                          {es}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium block mb-2">Eye Color</label>
                    <div className="flex gap-1 flex-wrap">
                      {["#4a6888", "#d08020", "#40a080", "#e04000", "#f040f0", "#c080ff", "#ccddcc", "#e08000"].map(col => (
                        <button key={col} onClick={() => setEyeColor(col)}
                          className={`w-6 h-6 rounded-full border-[2px] ${eyeColor === col ? "border-white shadow-[0_0_0_2px_#000]" : "border-black"}`}
                          style={{ backgroundColor: col }} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Facial Hair */}
                <div className="mb-5">
                  <label className="text-sm font-medium block mb-2">Facial Hair</label>
                  <div className="flex gap-2 flex-wrap">
                    {["none", "stubble", "beard", "mustache"].map(fh => (
                      <button key={fh} onClick={() => setFacialHair(fh)}
                        className={`px-3 py-1.5 rounded-lg border-[2px] font-bold text-xs uppercase ${facialHair === fh ? "bg-[#F74C9D] text-white border-black shadow-[0_2px_0_0_#000]" : "bg-white text-black border-black/20"}`}>
                        {fh}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Outfit Style */}
                <div className="mb-5">
                  <label className="text-sm font-medium block mb-2">Outfit Style</label>
                  <div className="grid grid-cols-3 gap-2">
                    {OUTFIT_STYLES.map(o => (
                      <motion.button key={o.value} onClick={() => setOutfitStyle(o.value)}
                        className="flex flex-col items-center gap-1 px-2 py-3 rounded-xl border-[3px] text-center transition-all"
                        style={{
                          background: outfitStyle === o.value ? `${realmTheme.accent}30` : "var(--ca-panel)",
                          borderColor: "var(--ca-border)",
                          boxShadow: outfitStyle === o.value ? `0 4px 0 0 ${realmTheme.accent}` : "0 4px 0 0 var(--ca-border)",
                          transform: outfitStyle === o.value ? "translateY(-2px)" : "none",
                        }}
                        whileHover={outfitStyle !== o.value ? { transform: "translateY(-1px)", boxShadow: "0 5px 0 0 var(--ca-border)" } : {}}
                        whileTap={{ transform: "translateY(2px)", boxShadow: "0 2px 0 0 var(--ca-border)" }}>
                        <span className="text-lg">{o.icon}</span>
                        <span className="text-xs font-bold" style={{ color: outfitStyle === o.value ? realmTheme.accent : "var(--ca-border)" }}>{o.label}</span>
                      </motion.button>
                    ))}
                  </div>
                  {OUTFIT_STYLES.find(o => o.value === outfitStyle) && (
                    <p className="text-xs mt-2 text-center text-muted-foreground italic">
                      {OUTFIT_STYLES.find(o => o.value === outfitStyle)?.desc}
                    </p>
                  )}
                </div>

                {/* Accessory */}
                <div className="mb-5">
                  <label className="text-sm font-medium block mb-2">Accessory</label>
                  <div className="flex gap-2 flex-wrap">
                    {ACCESSORY_OPTIONS.map(a => (
                      <button key={a.value} onClick={() => setAccessory(a.value)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all"
                        style={{
                          background: accessory === a.value ? `${realmTheme.accent}18` : "transparent",
                          borderColor: accessory === a.value ? realmTheme.accent : realmTheme.borderColor,
                          color: accessory === a.value ? realmTheme.accent : "hsl(240,5%,60%)",
                        }}>
                        <span>{a.icon}</span>
                        <span className="text-xs font-medium">{a.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Boss Mode: Stat Sliders */}
                {isBossMode && (
                  <div className="mb-5 rounded-xl border p-4"
                    style={{ background: "rgba(255,215,0,0.04)", borderColor: "rgba(255,215,0,0.3)" }}>
                    <label className="text-sm font-medium block mb-3">
                      <span style={{ color: "#ffd700" }}>⚙ Starting Stats</span>
                      <span className="text-muted-foreground text-xs ml-2">(Boss Mode — drag to customize)</span>
                    </label>
                    <div className="space-y-3">
                      {ALL_STAT_KEYS.map(stat => {
                        const val = bossStats[stat] ?? 50;
                        const statColors: Record<string, string> = {
                          health:"#ef4444", happiness:"#f59e0b", relationships:"#ec4899",
                          education:"#60a5fa", career:"#22d3ee", wealth:"#10b981",
                          charisma:"#c084fc", intelligence:"#818cf8", strength:"#fb923c",
                          magic:"#a78bfa", reputation:"#2dd4bf", faith:"#7dd3fc",
                          infamy:"#f43f5e", luck:"#a3e635",
                        };
                        const color = statColors[stat] ?? "#8898a8";
                        return (
                          <div key={stat} className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground capitalize w-20 shrink-0">{stat}</span>
                            <input type="range" min={0} max={100} value={val}
                              onChange={e => setBossStats(prev => ({ ...prev, [stat]: Number(e.target.value) }))}
                              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                              style={{ accentColor: color }} />
                            <span className="text-xs font-bold tabular-nums w-8 text-right" style={{ color }}>{val}</span>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setBossStats(Object.fromEntries(ALL_STAT_KEYS.map(k => [k, 80])) as any)}
                      className="mt-3 text-xs px-3 py-1 rounded-lg transition-all"
                      style={{ background: "rgba(255,215,0,0.12)", color: "#ffd700", border: "1px solid rgba(255,215,0,0.3)" }}>
                      ⚡ Max all stats
                    </button>
                  </div>
                )}

                <motion.button
                  onClick={() => setStep("talent")}
                  className="w-full h-14 rounded-xl border-[3px] font-serif text-xl font-bold transition-all"
                  style={{ background: realmTheme.accent, borderColor: "var(--ca-border)", color: "#000", boxShadow: "0 4px 0 0 var(--ca-border)" }}
                  whileHover={{ transform: "translateY(2px)", boxShadow: "0 2px 0 0 var(--ca-border)" }}
                  whileTap={{ transform: "translateY(4px)", boxShadow: "0 0 0 0 var(--ca-border)" }}>
                  Continue →
                </motion.button>
                <div className="h-8" />
              </motion.div>
            )}

            {/* ── STEP 4: TALENT SELECTION ─────────────────────────── */}
            {step === "talent" && (
              <motion.div key="talent"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>

                <h1 className="font-serif text-2xl font-bold mb-1" style={{ color: realmTheme.accent }}>
                  Natural Talent
                </h1>
                <p className="text-muted-foreground text-sm mb-5">
                  How gifted are you by birth? This affects how fast you grow and how many actions you have per year.
                </p>

                <div className="space-y-3">
                  {TALENT_LIST.map(t => {
                    const def = TALENTS[t];
                    const isSelected = talent === t;
                    return (
                      <motion.button key={t} onClick={() => setTalent(t)}
                        className="w-full p-4 rounded-xl border-[3px] text-left transition-all relative overflow-hidden"
                        style={{
                          background: isSelected ? `${def.color}30` : "var(--ca-panel)",
                          borderColor: "var(--ca-border)",
                          boxShadow: isSelected ? `0 4px 0 0 ${def.color}` : "0 4px 0 0 var(--ca-border)",
                          transform: isSelected ? "translateY(-2px)" : "none",
                        }}
                        whileHover={!isSelected ? { transform: "translateY(-1px)", boxShadow: "0 5px 0 0 var(--ca-border)" } : {}}
                        whileTap={{ transform: "translateY(2px)", boxShadow: "0 2px 0 0 var(--ca-border)" }}>
                        {isSelected && (
                          <motion.div
                            className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ background: def.color, color: "#000" }}
                            initial={{ scale: 0 }} animate={{ scale: 1 }}>✓</motion.div>
                        )}
                        <div className="flex items-center gap-3 mb-1.5">
                          <span className="text-2xl">{def.icon}</span>
                          <div>
                            <span className="font-serif font-bold text-base" style={{ color: isSelected ? def.color : "inherit" }}>{def.label}</span>
                            <div className="flex gap-3 mt-0.5">
                              <span className="text-xs" style={{ color: def.color }}>
                                {def.actionBonus > 0 ? `+${def.actionBonus}` : def.actionBonus} actions/yr
                              </span>
                              <span className="text-xs" style={{ color: def.color }}>
                                ×{def.statMult.toFixed(2)} stat gains
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{def.desc}</p>
                      </motion.button>
                    );
                  })}
                </div>

                <motion.button
                  onClick={() => setStep("romance")}
                  className="mt-6 w-full h-14 rounded-xl border-[3px] font-serif text-xl font-bold transition-all"
                  style={{ background: realmTheme.accent, borderColor: "var(--ca-border)", color: "#000", boxShadow: "0 4px 0 0 var(--ca-border)" }}
                  whileHover={{ transform: "translateY(2px)", boxShadow: "0 2px 0 0 var(--ca-border)" }}
                  whileTap={{ transform: "translateY(4px)", boxShadow: "0 0 0 0 var(--ca-border)" }}>
                  Continue →
                </motion.button>
                <div className="h-8" />
              </motion.div>
            )}

            {/* ── STEP 5: ROMANCE PREFERENCES ──────────────────────── */}
            {step === "romance" && (
              <motion.div key="romance"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">❤</span>
                  <h1 className="font-serif text-2xl font-bold" style={{ color: realmTheme.accent }}>Story Tone</h1>
                </div>
                <p className="text-muted-foreground text-sm mb-6">
                  How much do you want love and intimacy to shape this life?
                </p>

                <div className="space-y-3">
                  {ROMANCE_OPTIONS.map(opt => {
                    const isSelected = romanceLevel === opt.value;
                    return (
                      <motion.button key={opt.value} onClick={() => setRomance(opt.value)}
                        className="w-full p-4 rounded-xl border-[3px] text-left transition-all relative overflow-hidden"
                        style={{
                          background: isSelected ? `${opt.color}30` : "var(--ca-panel)",
                          borderColor: "var(--ca-border)",
                          boxShadow: isSelected ? `0 4px 0 0 ${opt.color}` : "0 4px 0 0 var(--ca-border)",
                          transform: isSelected ? "translateY(-2px)" : "none",
                        }}
                        whileHover={!isSelected ? { transform: "translateY(-1px)", boxShadow: "0 5px 0 0 var(--ca-border)" } : {}}
                        whileTap={{ transform: "translateY(2px)", boxShadow: "0 2px 0 0 var(--ca-border)" }}>
                        {isSelected && (
                          <motion.div
                            className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ background: opt.color, color: "#fff" }}
                            initial={{ scale: 0 }} animate={{ scale: 1 }}>✓</motion.div>
                        )}
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{opt.icon}</span>
                          <span className="font-serif font-bold text-base" style={{ color: isSelected ? opt.color : "inherit" }}>
                            {opt.label}
                          </span>
                          {opt.value === "explicit" && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: `${opt.color}20`, color: opt.color }}>18+</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{opt.desc}</p>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Character summary */}
                <div className="mt-5 p-4 rounded-xl border-[3px]" style={{ borderColor: "var(--ca-border)", background: "var(--ca-panel)", boxShadow: "0 4px 0 0 var(--ca-border)" }}>
                  <p className="text-xs font-medium mb-2" style={{ color: realmTheme.accent }}>Your Chronicle:</p>
                  <div className="flex items-center gap-3">
                    <div style={{ width: 44, height: 60, flexShrink: 0 }}
                      dangerouslySetInnerHTML={{ __html: getSpriteSvg(bloodline, gender, 20, 0, outfitStyle, accessory) }} />
                    <div className="text-xs space-y-1">
                      <div><span className="text-muted-foreground">Name:</span> <span style={{ color: realmTheme.accent }}>{name}</span>{familyName && <span className="text-muted-foreground"> of {familyName}</span>}</div>
                      <div><span className="text-muted-foreground">Bloodline:</span> <span>{bloodline}</span></div>
                      <div><span className="text-muted-foreground">Realm:</span> <span>{realm}</span></div>
                      <div><span className="text-muted-foreground">Talent:</span> <span style={{ color: talentDef.color }}>{talentDef.icon} {talent}</span></div>
                      {isBossMode && bossClan && bossClan !== "None" && (() => {
                        const cd = CLANS.find(c => c.name === bossClan);
                        const td = cd ? CLAN_TIERS[cd.tier] : null;
                        return <div><span className="text-muted-foreground">Clan:</span> <span style={{ color: td?.color ?? "#ffd700" }}>{cd?.icon} {bossClan}</span></div>;
                      })()}
                      {isBossMode && <div><span style={{ color: "#ffd700" }}>👑 Boss Mode</span></div>}
                    </div>
                  </div>
                </div>

                <motion.button
                  onClick={handleStart}
                  className="mt-6 w-full h-14 rounded-xl border-[3px] font-serif text-xl font-bold transition-all"
                  style={{
                    background: isBossMode ? "var(--ca-yellow)" : realmTheme.accent,
                    borderColor: "var(--ca-border)",
                    color: "#000",
                    boxShadow: "0 4px 0 0 var(--ca-border)",
                  }}
                  whileHover={{ transform: "translateY(2px)", boxShadow: "0 2px 0 0 var(--ca-border)" }}
                  whileTap={{ transform: "translateY(4px)", boxShadow: "0 0 0 0 var(--ca-border)" }}
                  data-testid="btn-begin-life">
                  {isBossMode ? "⚡ Enter as Boss" : "Begin Life"}
                </motion.button>
                <div className="h-8" />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
