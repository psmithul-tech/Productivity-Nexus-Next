import { useState, useMemo } from "react";
import { useRouter } from "../App";
import { motion, AnimatePresence } from "framer-motion";
import { WORLD_NPCS, CATEGORY_LABELS, CATEGORY_ICONS, WorldNPC } from "@/lib/games/life-chronicle/engine/npcLeaderboard";
import { useGame } from "@/lib/games/life-chronicle/engine/GameContext";
import NpcChat from "../NpcChat";

type Category = WorldNPC["category"] | "all";
type TopTab = "rankings" | "events" | "wars" | "rivals";

const CATEGORIES: { key: Category; label: string; icon: string }[] = [
  { key: "all",        label: "All",         icon: "✵" },
  { key: "cultivator", label: "Cultivators", icon: "⚡" },
  { key: "mage",       label: "Archmages",   icon: "✦" },
  { key: "wealth",     label: "Wealthiest",  icon: "◈" },
  { key: "power",      label: "Powerful",    icon: "⚔" },
  { key: "influence",  label: "Influential", icon: "🔮" },
  { key: "infamy",     label: "Most Feared", icon: "💀" },
];

const TOP_TABS: { key: TopTab; label: string; icon: string }[] = [
  { key: "rankings", label: "Rankings", icon: "👑" },
  { key: "events",   label: "World News", icon: "📜" },
  { key: "wars",     label: "Wars",       icon: "⚔" },
  { key: "rivals",   label: "Rivals",     icon: "🔥" },
];

const CATEGORY_BORDER: Record<WorldNPC["category"], string> = {
  cultivator: "#f0a830",
  mage:       "#8080f0",
  wealth:     "#50d080",
  power:      "#e05050",
  influence:  "#c060e0",
  infamy:     "#e0a040",
};

const EVENT_TYPE_COLOR: Record<string, string> = {
  war_declared: "#EF476F",
  war_ended: "#3E85E4",
  war_victory: "#FFD166",
  power_ascension: "#F78C6B",
  realm_plague: "#06D6A0",
  golden_age: "#FFD166",
  betrayal: "#9D4EDD",
  death: "#8898a8",
  alliance: "#06D6A0",
  discovery: "#3E85E4",
  tyranny: "#F78C6B",
  exile: "#9D4EDD",
  duel: "#EF476F",
};

function PowerBar({ value, color }: { value: number; color?: string }) {
  const pct = Math.min(100, (value / 100000) * 100);
  const barColor = color ?? (pct > 95 ? "#FFD166" : pct > 85 ? "#F78C6B" : pct > 70 ? "#3E85E4" : "#06D6A0");
  return (
    <div className="h-3 rounded-full mt-1 overflow-hidden border-[2px] border-black bg-gray-100 shadow-[inset_0_2px_0_0_rgba(0,0,0,0.1)]">
      <motion.div className="h-full border-r-[2px] border-black" style={{ background: barColor }}
        initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
    </div>
  );
}

function DeltaBadge({ delta }: { delta: number }) {
  if (Math.abs(delta) < 200) return null;
  const color = delta > 0 ? "#06D6A0" : "#EF476F";
  const icon = delta > 0 ? "▲" : "▼";
  const kStr = Math.abs(delta) >= 1000 ? `${(Math.abs(delta)/1000).toFixed(1)}k` : String(Math.abs(delta));
  return (
    <span className="text-[10px] ml-1 font-black px-1 py-0.5 border-[2px] border-black rounded bg-white shadow-[0_2px_0_0_#000]" style={{ color }}>
      {icon}{kStr}
    </span>
  );
}

export default function Leaderboard() {
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [topTab, setTopTab] = useState<TopTab>("rankings");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [chatNpc, setChatNpc] = useState<WorldNPC | null>(null);
  const { navigate } = useRouter();
  const { state, worldState } = useGame();

  const sorted = useMemo(() => {
    return [...WORLD_NPCS]
      .filter(n => {
        if (activeCategory !== "all" && n.category !== activeCategory) return false;
        return worldState.npcAlive[n.name] !== false;
      })
      .map(n => ({
        ...n,
        livepower: worldState.npcPowers[n.name] ?? n.power,
        delta: (worldState.npcPowers[n.name] ?? n.power) - n.power,
      }))
      .sort((a, b) => b.livepower - a.livepower);
  }, [activeCategory, worldState]);

  const playerLegacy = state?.legacyScore ?? 0;
  const playerRank = sorted.filter(n => n.livepower > playerLegacy).length + 1;

  const deadCount = WORLD_NPCS.filter(n => worldState.npcAlive[n.name] === false).length;
  const recentEvents = [...worldState.events].reverse().slice(0, 20);
  const activeWars = worldState.activeWars;
  const playerRivals = worldState.playerRivals ?? [];

  return (
    <div className="h-full w-full overflow-y-auto bg-white custom-scrollbar dotted-bg">
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 pt-4 pb-3 bg-white border-b-[3px] border-black shadow-[0_4px_0_0_rgba(0,0,0,0.1)]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button className="block-btn bg-gray-100 text-black px-3 py-1 text-xs font-black"
              onClick={() => navigate("home")}>
              ← RETURN
            </button>
            <div className="text-right">
              <h1 className="text-2xl font-heading font-black text-black uppercase tracking-widest">
                World Powers
              </h1>
              <p className="text-[10px] font-bold text-gray-500 uppercase mt-0.5">
                Year {worldState.year} · {sorted.length} Legends
                {deadCount > 0 && <span className="ml-1 text-[#EF476F]">({deadCount} Fallen)</span>}
              </p>
            </div>
          </div>

          {/* Top Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {TOP_TABS.map(t => (
              <button key={t.key} onClick={() => setTopTab(t.key)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-black uppercase border-[2px] border-black transition-all ${
                  topTab === t.key ? "bg-[#FFD166] shadow-[0_4px_0_0_#000] translate-y-[-2px]" : "bg-white shadow-[0_2px_0_0_#000] hover:bg-gray-50"
                }`}>
                <span>{t.icon}</span>
                <span>{t.label}</span>
                {t.key === "wars" && activeWars.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded border border-black bg-[#EF476F] text-white text-[10px]">
                    {activeWars.length}
                  </span>
                )}
                {t.key === "rivals" && playerRivals.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded border border-black bg-[#EF476F] text-white text-[10px]">
                    {playerRivals.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Category tabs */}
          {topTab === "rankings" && (
            <div className="flex gap-2 overflow-x-auto pb-1 mt-2 no-scrollbar">
              {CATEGORIES.map(cat => (
                <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase border-[2px] border-black rounded-full transition-all ${
                    activeCategory === cat.key ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"
                  }`}>
                  <span>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-3 pb-20">

        {/* ── RANKINGS TAB ── */}
        {topTab === "rankings" && (
          <>
            {/* Player row */}
            {state && (
              <motion.div className="block-panel bg-[#FFD166] p-3 border-[3px] border-black shadow-[0_4px_0_0_#000]"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-3">
                  <div className="font-heading font-black text-lg w-8 text-center text-black">#{playerRank}</div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-white border-[2px] border-black shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.1)]">★</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-black text-sm text-black uppercase truncate">{state.name}</span>
                      <span className="text-[10px] font-black px-1.5 py-0.5 bg-black text-white border-[2px] border-black rounded">YOU</span>
                    </div>
                    <div className="text-[10px] font-bold text-black/60 uppercase truncate mt-0.5">
                      {state.bloodline} · {state.realm}
                    </div>
                    <PowerBar value={playerLegacy} color="#3E85E4" />
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-heading font-black text-sm text-black">{(playerLegacy/1000).toFixed(1)}k</div>
                    <div className="text-[10px] font-bold uppercase text-black/60">Legacy</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* NPC list */}
            <AnimatePresence mode="popLayout">
              {sorted.map((npc, i) => {
                const isExpanded = expanded === npc.name;
                const borderColor = CATEGORY_BORDER[npc.category];
                const isAtWar = activeWars.some(w => w.attacker === npc.name || w.defender === npc.name);

                return (
                  <motion.div key={npc.name} layout
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                    className="block-panel p-0 overflow-hidden cursor-pointer bg-white transition-all hover:-translate-y-1 hover:shadow-[0_6px_0_0_#000]"
                    onClick={() => setExpanded(isExpanded ? null : npc.name)}>

                    <div className="flex items-center gap-3 p-3">
                      <div className="font-heading font-black text-base w-8 text-center shrink-0 text-black">
                        {i === 0 ? "👑" : i < 3 ? `#${i+1}` : `${i+1}`}
                      </div>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border-[2px] border-black shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.1)]"
                        style={{ backgroundColor: `${borderColor}20` }}>
                        {npc.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-heading font-black text-sm text-black uppercase truncate">
                            {npc.name}
                          </span>
                          <span className="text-[10px] font-black px-1 py-0.5 rounded border-[2px] border-black shadow-[0_2px_0_0_#000] bg-white"
                            style={{ color: borderColor }}>
                            {CATEGORY_ICONS[npc.category]}
                          </span>
                          {isAtWar && (
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded border-[2px] border-black bg-[#EF476F] text-white shadow-[0_2px_0_0_#000]">
                              WAR
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase truncate">{npc.title}</div>
                        <div className="flex items-center gap-1 mt-0.5 text-[9px] font-black text-gray-400 uppercase">
                          <span>{npc.bloodline}</span>
                          <span>·</span>
                          <span>{npc.realm}</span>
                        </div>
                        <PowerBar value={npc.livepower} color={borderColor} />
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-heading font-black text-sm text-black">
                          {(npc.livepower / 1000).toFixed(1)}k
                        </div>
                        <DeltaBadge delta={npc.delta} />
                        <button
                          className="block-btn text-xs mt-2 px-3 py-1 bg-white text-black text-[10px] w-full"
                          onClick={e => { e.stopPropagation(); setChatNpc(npc); }}>
                          CHAT
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                          className="overflow-hidden border-t-[2px] border-black bg-gray-50">
                          <div className="px-4 pb-4 pt-3">
                            <p className="text-xs font-bold text-gray-600 leading-relaxed bg-white p-3 rounded-xl border-[2px] border-black border-dashed">
                              "{npc.description}"
                            </p>
                            <div className="grid grid-cols-3 gap-2 mt-3">
                              <div className="p-2 rounded-xl text-center bg-white border-[2px] border-black shadow-[0_2px_0_0_#000]">
                                <div className="text-[10px] font-black text-black">{CATEGORY_LABELS[npc.category]}</div>
                                <div className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">Type</div>
                              </div>
                              <div className="p-2 rounded-xl text-center bg-white border-[2px] border-black shadow-[0_2px_0_0_#000]">
                                <div className="text-[10px] font-black text-black">{npc.livepower.toLocaleString()}</div>
                                <div className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">Power</div>
                              </div>
                              <div className="p-2 rounded-xl text-center bg-white border-[2px] border-black shadow-[0_2px_0_0_#000]">
                                <div className="text-[10px] font-black text-black truncate">{npc.realm}</div>
                                <div className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">Realm</div>
                              </div>
                            </div>
                            {(npc.familyName || npc.empire) && (
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                {npc.familyName && (
                                  <div className="p-2 rounded-xl text-center bg-[#FFD166]/20 border-[2px] border-[#FFD166]">
                                    <div className="text-[10px] font-black text-black">{npc.familyName}</div>
                                    <div className="text-[9px] font-bold text-gray-500 uppercase mt-0.5">Dynasty</div>
                                  </div>
                                )}
                                {npc.empire && (
                                  <div className="p-2 rounded-xl text-center bg-[#3E85E4]/20 border-[2px] border-[#3E85E4]">
                                    <div className="text-[10px] font-black text-black">{npc.empire}</div>
                                    <div className="text-[9px] font-bold text-gray-500 uppercase mt-0.5">Empire</div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </>
        )}

        {/* ── WORLD EVENTS TAB ── */}
        {topTab === "events" && (
          <>
            {recentEvents.length === 0 ? (
              <div className="block-panel bg-white p-6 text-center border-dashed border-gray-300 text-gray-400">
                <p className="text-5xl mb-3 grayscale">📜</p>
                <p className="font-heading font-black uppercase text-sm">No World Events Yet</p>
                <p className="text-[10px] font-bold mt-1">Age up in your life to trigger world history.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEvents.map(ev => {
                  const color = EVENT_TYPE_COLOR[ev.type] ?? "#8898a8";
                  return (
                    <motion.div key={ev.id}
                      className="block-panel bg-white p-3 flex items-start gap-3"
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl border-[2px] border-black shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.1)]"
                        style={{ backgroundColor: `${color}20` }}>
                        {ev.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-heading font-black text-sm uppercase" style={{ color }}>{ev.title}</span>
                          <span className="text-[10px] font-black bg-black text-white px-1.5 py-0.5 rounded border-[2px] border-black">Yr {ev.year}</span>
                        </div>
                        <p className="text-[11px] font-bold text-gray-600 leading-relaxed">
                          {ev.description}
                        </p>
                        {ev.affected.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {ev.affected.slice(0,3).map(name => (
                              <span key={name} className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded border-[2px] border-black bg-gray-100">
                                {name.split(" ")[0]}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── ACTIVE WARS TAB ── */}
        {topTab === "wars" && (
          <>
            {activeWars.length === 0 ? (
              <div className="block-panel bg-white p-6 text-center border-dashed border-gray-300 text-gray-400">
                <p className="text-5xl mb-3 grayscale">🕊</p>
                <p className="font-heading font-black uppercase text-sm">No Active Wars</p>
                <p className="text-[10px] font-bold mt-1">The realms are at peace… for now.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeWars.map(war => {
                  const attPow = worldState.npcPowers[war.attacker] ?? 50000;
                  const defPow = worldState.npcPowers[war.defender] ?? 50000;
                  const duration = worldState.year - war.startYear;
                  const attAdvantage = attPow > defPow;
                  const ratio = Math.max(attPow, defPow) / Math.max(1, Math.min(attPow, defPow));

                  return (
                    <motion.div key={war.id}
                      className="block-panel bg-white p-0 overflow-hidden"
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                      <div className="px-3 py-2 flex items-center justify-between border-b-[2px] border-black bg-[#EF476F]">
                        <span className="text-[10px] font-black uppercase text-white tracking-widest">⚔ ONGOING WAR</span>
                        <span className="text-[10px] font-bold text-white/80 uppercase">Started Yr {war.startYear} · {duration} yrs long</span>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex-1 text-center">
                            <div className="font-heading font-black text-sm uppercase truncate" style={{ color: attAdvantage ? "#FFD166" : "#3E85E4" }}>
                              {war.attacker.split(" ")[0]}
                            </div>
                            <div className="text-[9px] font-bold text-gray-500 uppercase mt-0.5">Attacker</div>
                            <div className="text-[11px] font-black mt-1 bg-gray-100 rounded inline-block px-1 border border-black">
                              {(attPow/1000).toFixed(1)}k
                            </div>
                          </div>
                          <div className="text-xl font-heading font-black text-[#EF476F] border-[2px] border-black p-1 rounded-lg shadow-[0_2px_0_0_#000]">VS</div>
                          <div className="flex-1 text-center">
                            <div className="font-heading font-black text-sm uppercase truncate" style={{ color: !attAdvantage ? "#FFD166" : "#3E85E4" }}>
                              {war.defender.split(" ")[0]}
                            </div>
                            <div className="text-[9px] font-bold text-gray-500 uppercase mt-0.5">Defender</div>
                            <div className="text-[11px] font-black mt-1 bg-gray-100 rounded inline-block px-1 border border-black">
                              {(defPow/1000).toFixed(1)}k
                            </div>
                          </div>
                        </div>

                        <div className="relative h-4 rounded-full overflow-hidden border-[2px] border-black bg-gray-100 shadow-[inset_0_2px_0_0_rgba(0,0,0,0.1)]">
                          <motion.div className="absolute left-0 h-full border-r-[2px] border-black"
                            style={{ background: "#EF476F", width: `${(attPow/(attPow+defPow))*100}%` }}
                            initial={{ width: 0 }} animate={{ width: `${(attPow/(attPow+defPow))*100}%` }} />
                        </div>
                        <div className="flex justify-between text-[9px] font-black text-gray-400 mt-2 uppercase">
                          <span className="text-[#EF476F]">Attacker</span>
                          <span>{ratio.toFixed(1)}× advantage</span>
                          <span className="text-[#3E85E4]">Defender</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── RIVALS TAB ── */}
        {topTab === "rivals" && (
          <>
            {playerRivals.length === 0 ? (
              <div className="block-panel bg-white p-6 text-center border-dashed border-gray-300 text-gray-400">
                <p className="text-5xl mb-3 grayscale">🤝</p>
                <p className="font-heading font-black uppercase text-sm">No Rivals Yet</p>
                <p className="text-[10px] font-bold mt-1">Grow your power to attract the attention of Legends.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-[10px] font-black text-[#EF476F] uppercase border-[2px] border-[#EF476F] bg-[#EF476F]/10 py-1 px-3 rounded-full inline-block">
                    These legends see you as a threat
                  </p>
                </div>
                {playerRivals.map(rivalName => {
                  const npc = WORLD_NPCS.find(n => n.name === rivalName);
                  if (!npc) return null;
                  const livepower = worldState.npcPowers[npc.name] ?? npc.power;
                  const borderColor = CATEGORY_BORDER[npc.category] ?? "#000";

                  return (
                    <motion.div key={npc.name} className="block-panel bg-white p-4"
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 border-[3px] border-black shadow-[inset_0_-3px_0_0_rgba(0,0,0,0.1)] bg-gray-50">
                          {npc.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-heading font-black text-lg text-black uppercase">{npc.name}</span>
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded border-[2px] border-black shadow-[0_2px_0_0_#000] bg-white" style={{ color: borderColor }}>
                              {CATEGORY_ICONS[npc.category]}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-gray-500 mb-2">"{npc.description}"</p>
                          <div className="flex gap-2">
                            <div className="text-[10px] font-black bg-gray-100 border-[2px] border-black px-2 py-1 rounded">
                              PWR: {(livepower/1000).toFixed(1)}k
                            </div>
                            <button className="block-btn text-[10px] px-3 py-1 bg-[#EF476F] text-white"
                              onClick={() => setChatNpc(npc)}>
                              CONFRONT
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

      </div>

      {/* NPC Chat */}
      <AnimatePresence>
        {chatNpc && (
          <NpcChat npc={chatNpc} gameState={state ?? undefined} onClose={() => setChatNpc(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

