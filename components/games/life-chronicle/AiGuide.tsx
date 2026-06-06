import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/games/life-chronicle/engine/GameContext";
import { askOracle, GuideMode } from "@/lib/games/life-chronicle/engine/aiGuide";
import { RealmTheme } from "@/lib/games/life-chronicle/engine/realmThemes";

const MODES: { key: GuideMode; label: string; icon: string; desc: string }[] = [
  { key: "advice",   label: "Strategic Advice", icon: "⚡", desc: "What should I focus on?" },
  { key: "lore",     label: "Realm Lore",        icon: "📜", desc: "Tell me about my world" },
  { key: "prophecy", label: "Prophecy",           icon: "🔮", desc: "What fate awaits me?" },
  { key: "critique", label: "Harsh Truth",        icon: "⚔", desc: "What am I doing wrong?" },
];

interface Props {
  theme: RealmTheme;
  eventNarrative?: string;
}

export default function AiGuide({ theme, eventNarrative }: Props) {
  const { state } = useGame();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<GuideMode | null>(null);

  if (!state) return null;

  const askMode = async (mode: GuideMode) => {
    setLoading(true);
    setActiveMode(mode);
    setResponse(null);
    const text = await askOracle(state, mode, eventNarrative);
    setResponse(text);
    setLoading(false);
  };

  return (
    <>
      {/* Floating Oracle Button */}
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed bottom-44 right-4 z-30 w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-xl border"
        style={{
          background: `radial-gradient(circle at 35% 35%, ${theme.accent}, ${theme.skyColor})`,
          borderColor: theme.accent,
          boxShadow: `0 0 16px ${theme.accentGlow}, 0 4px 12px rgba(0,0,0,0.6)`,
        }}
        animate={{
          boxShadow: [
            `0 0 12px ${theme.accentGlow}, 0 4px 12px rgba(0,0,0,0.6)`,
            `0 0 28px ${theme.accentGlow}, 0 4px 12px rgba(0,0,0,0.6)`,
            `0 0 12px ${theme.accentGlow}, 0 4px 12px rgba(0,0,0,0.6)`,
          ],
        }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        title="Consult the Oracle"
      >
        🔮
      </motion.button>

      {/* Oracle Modal */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed inset-x-4 bottom-4 z-50 rounded-2xl border overflow-hidden"
              style={{
                background: theme.parchmentBg,
                borderColor: theme.borderColor,
                boxShadow: `0 0 60px ${theme.accentGlow}, 0 20px 40px rgba(0,0,0,0.8)`,
                maxWidth: 480,
                margin: "0 auto",
                maxHeight: "70vh",
              }}
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: "spring", damping: 22, stiffness: 300 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b"
                style={{ borderColor: theme.borderColor }}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔮</span>
                  <div>
                    <h3 className="font-serif font-bold text-sm" style={{ color: theme.accent }}>
                      The Oracle
                    </h3>
                    <p className="text-xs text-muted-foreground">{theme.ambientDesc}</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
                >
                  ✕
                </button>
              </div>

              <div className="overflow-y-auto" style={{ maxHeight: "calc(70vh - 70px)" }}>
                {/* Mode Buttons */}
                <div className="grid grid-cols-2 gap-2 p-4">
                  {MODES.map(m => (
                    <button
                      key={m.key}
                      onClick={() => askMode(m.key)}
                      disabled={loading}
                      className="flex flex-col items-start gap-1 px-3 py-3 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      style={{
                        borderColor: activeMode === m.key ? theme.accent : theme.borderColor,
                        background: activeMode === m.key ? `${theme.accent}18` : "transparent",
                      }}
                    >
                      <span className="text-lg">{m.icon}</span>
                      <span className="font-serif text-xs font-bold text-foreground">{m.label}</span>
                      <span className="text-xs text-muted-foreground">{m.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Response Area */}
                <AnimatePresence mode="wait">
                  {loading && (
                    <motion.div
                      key="loading"
                      className="px-5 pb-5 flex items-center gap-3"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    >
                      <motion.span
                        className="text-xl"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      >🔮</motion.span>
                      <p className="text-sm italic text-muted-foreground">
                        The Oracle peers into the currents of fate…
                      </p>
                    </motion.div>
                  )}
                  {response && !loading && (
                    <motion.div
                      key="response"
                      className="mx-4 mb-5 px-4 py-4 rounded-xl border"
                      style={{
                        borderColor: theme.borderColor,
                        background: `${theme.accent}0f`,
                        boxShadow: `inset 0 0 20px ${theme.accentGlow}20`,
                      }}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    >
                      <p className="text-sm font-serif leading-relaxed italic"
                        style={{ color: theme.accent }}>
                        ❝ {response} ❞
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Event Commentary Button */}
                {eventNarrative && (
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => askMode("event")}
                      disabled={loading}
                      className="w-full py-3 px-4 rounded-xl border text-sm font-serif transition-all hover:scale-[1.01]"
                      style={{
                        borderColor: theme.accent,
                        color: theme.accent,
                        background: `${theme.accent}10`,
                      }}
                    >
                      🌟 Oracle: Comment on this event
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
