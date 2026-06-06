import { useState } from "react";
import { useRouter } from "../App";
import { useGame } from "@/lib/games/life-chronicle/engine/GameContext";
import { submitScore } from "../lib/actions";
import { generatePlayerId } from "@/lib/games/life-chronicle/engine/cloudSave";
import { useToast } from "@/components/games/life-chronicle/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Gender } from "@/lib/games/life-chronicle/engine/types";
import { getSpriteSvg } from "@/lib/games/life-chronicle/engine/sprite";

function StatBlock({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="text-center p-4 rounded-xl"
      style={{ background: "#1d2024", border: "1px solid rgba(244,175,37,0.1)" }}>
      <div className="font-mono text-2xl font-bold" style={{ color: color ?? "#ffd085" }}>{value}</div>
      <div className="label-caps mt-1" style={{ color: "#878792" }}>{label}</div>
    </div>
  );
}

export default function Death() {
  const { navigate } = useRouter();
  const { state, continueAsChild, reincarnate } = useGame();
  const { toast } = useToast();

  const [showChildPicker, setShowChildPicker] = useState(false);
  const [showReincarnateModal, setShowReincarnateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!state || state.isAlive) { navigate("home"); return null; }

  const legacyScore = state.legacyScore || (state.age * 10 + state.stats.wealth);
  const hasChildren = state.children.length > 0;

  const handleSubmit = () => {
    setIsSubmitting(true);
    submitScore({
      playerId: "legacy-player",
      playerName: state.name,
      characterName: state.name,
      realm: state.realm,
      bloodline: state.bloodline,
      legacyScore,
      lifespan: state.age,
      cause: state.deathCause ?? "Unknown",
    })
      .then(() => {
        toast({ title: "Legend Recorded", description: "Your legacy is immortalized in the Hall." });
        navigate("leaderboard");
      })
      .catch(() => {
        setIsSubmitting(false);
        toast({ title: "Error", description: "Could not submit score.", variant: "destructive" });
      });
  };

  const handleContinueAsChild = (idx: number) => { continueAsChild(idx); navigate("game"); };
  const handleReincarnate = () => { reincarnate(); navigate("create"); };
  const reincarnationTier = Math.max(0, Math.floor(state.mysticalTier * 0.6));

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar flex items-center justify-center p-4"
      style={{ background: "radial-gradient(ellipse at 50% 20%, rgba(180,30,30,0.07) 0%, #111318 55%)" }}>
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="text-center space-y-6">

          {/* ── Death header ──────────────────────── */}
          <div className="space-y-3">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}>
              <div className="text-6xl font-serif font-bold tracking-widest"
                style={{ color: "#d44", textShadow: "0 0 40px rgba(200,50,50,0.4)" }}>
                FATE SEALED
              </div>
            </motion.div>
            <p className="text-lg font-serif italic" style={{ color: "#d5c4ad" }}>
              {state.name} has passed from this world at age {state.age}.
            </p>
            {state.generation > 1 && (
              <p className="text-sm font-serif" style={{ color: "rgba(244,175,37,0.65)" }}>
                Generation {state.generation} · Line of {state.inheritedSoul?.parentName}
              </p>
            )}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ background: "rgba(200,50,50,0.12)", border: "1px solid rgba(200,50,50,0.35)", color: "#f87171" }}>
              <span className="text-sm font-medium">{state.deathCause ?? "Unknown cause"}</span>
            </div>
          </div>

          {/* ── Legacy divider ───────────────────── */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "rgba(244,175,37,0.15)" }} />
            <span className="label-caps" style={{ color: "#878792" }}>Legacy</span>
            <div className="flex-1 h-px" style={{ background: "rgba(244,175,37,0.15)" }} />
          </div>

          {/* ── Stats grid ───────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <StatBlock label="Lifespan" value={`${state.age} yrs`} color="#ffd085" />
            <StatBlock label="Legacy Score" value={legacyScore.toLocaleString()} color="#F4AF25" />
            <StatBlock label="Properties" value={state.properties.length} color="#50d080" />
            <StatBlock label="Achievements" value={state.achievements.length} color="#c084fc" />
            <StatBlock label="Children" value={state.children.length} color="#f472b6" />
            <StatBlock label="Infamy" value={state.stats.infamy}
              color={state.stats.infamy > 50 ? "#f87171" : "#878792"} />
          </div>

          {/* ── Tags ────────────────────────────── */}
          <div className="flex justify-center gap-2 flex-wrap">
            <span className="text-xs px-3 py-1.5 rounded-full"
              style={{ background: "rgba(244,175,37,0.12)", border: "1px solid rgba(244,175,37,0.3)", color: "#ffd085" }}>
              {state.bloodline}
            </span>
            <span className="text-xs px-3 py-1.5 rounded-full"
              style={{ background: "rgba(135,135,146,0.1)", border: "1px solid rgba(135,135,146,0.2)", color: "#878792" }}>
              {state.realm}
            </span>
            {state.mysticalPath !== "none" && (
              <span className="text-xs px-3 py-1.5 rounded-full"
                style={{ background: "rgba(128,128,240,0.12)", border: "1px solid rgba(128,128,240,0.3)", color: "#a78bfa" }}>
                Tier {state.mysticalTier} {state.mysticalPath.replace("_"," ")}
              </span>
            )}
          </div>

          {/* ── Action buttons ───────────────────── */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              data-testid="btn-submit-legacy"
              className="w-full h-14 rounded-xl font-serif text-xl font-bold btn-primary disabled:opacity-60">
              {isSubmitting ? "Recording…" : "Immortalize Your Legacy"}
            </button>

            {hasChildren && (
              <button
                onClick={() => setShowChildPicker(true)}
                className="w-full h-12 rounded-xl font-serif text-base font-bold transition-all"
                style={{
                  background: "linear-gradient(135deg, rgba(76,29,149,0.6), rgba(124,58,237,0.4))",
                  border: "1px solid rgba(167,139,250,0.45)",
                  color: "#c4b5fd",
                  boxShadow: "0 4px 20px rgba(124,58,237,0.2)",
                }}>
                👶 Continue the Bloodline ({state.children.length})
              </button>
            )}

            <button
              onClick={() => setShowReincarnateModal(true)}
              data-testid="btn-reincarnate"
              className="w-full h-12 rounded-xl font-serif text-base font-bold transition-all"
              style={{
                background: "linear-gradient(135deg, rgba(6,78,118,0.6), rgba(2,44,80,0.6))",
                border: "1px solid rgba(128,192,255,0.35)",
                color: "#99cbff",
                boxShadow: "0 4px 20px rgba(128,192,255,0.12)",
              }}>
              ✦ Reincarnate with Soul Memory
            </button>

            <button
              onClick={() => navigate("home")}
              className="w-full h-11 rounded-xl font-serif text-base transition-colors"
              style={{ border: "1px solid rgba(135,135,146,0.2)", color: "#878792" }}>
              New Life
            </button>
          </div>
        </motion.div>
      </div>

      {/* ── CHILD PICKER MODAL ──────────────────────── */}
      <AnimatePresence>
        {showChildPicker && (
          <>
            <motion.div className="fixed inset-0 z-40 backdrop-blur-sm bg-black/70"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowChildPicker(false)} />
            <motion.div
              className="fixed inset-x-4 top-1/2 z-50 rounded-2xl overflow-hidden"
              style={{ background: "#1d2024", border: "1px solid rgba(167,139,250,0.4)", boxShadow: "0 0 60px rgba(124,58,237,0.2)", maxWidth: 440, margin: "0 auto" }}
              initial={{ opacity: 0, scale: 0.92, y: "-40%" }}
              animate={{ opacity: 1, scale: 1, y: "-50%" }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: "spring", damping: 22, stiffness: 300 }}>

              <div className="px-5 py-3 label-caps"
                style={{ background: "rgba(124,58,237,0.1)", color: "#c084fc", borderBottom: "1px solid rgba(167,139,250,0.15)" }}>
                👶 Continue the Bloodline
              </div>

              <div className="px-5 py-4">
                <p className="text-sm mb-4" style={{ color: "#9e8f7a" }}>
                  Choose an heir to carry {state.name}'s legacy forward.
                </p>
                <div className="space-y-2 mb-4">
                  {state.children.map((child, i) => (
                    <motion.button key={i}
                      onClick={() => handleContinueAsChild(i)}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all"
                      style={{ borderColor: "rgba(167,139,250,0.3)", background: "rgba(124,58,237,0.08)" }}>
                      <div className="w-10 h-12 shrink-0"
                        dangerouslySetInnerHTML={{ __html: getSpriteSvg(child.bloodline, child.gender as Gender, child.age, (child.name.charCodeAt(0) + i) * 137) }} />
                      <div className="flex-1">
                        <div className="font-serif font-bold text-sm" style={{ color: "#d8b4fe" }}>{child.name}</div>
                        <div className="text-xs" style={{ color: "#878792" }}>
                          {child.gender} · {child.bloodline} · Age {child.age}
                        </div>
                      </div>
                      <div className="text-xs shrink-0" style={{ color: "#a78bfa" }}>Play →</div>
                    </motion.button>
                  ))}
                </div>

                <div className="p-3 rounded-lg text-xs space-y-1 mb-3"
                  style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(167,139,250,0.15)" }}>
                  <div className="font-semibold mb-1" style={{ color: "#c084fc" }}>What they inherit:</div>
                  {[
                    ["Starting stat boost", "+12% of parent's stats"],
                    ["Properties", "Up to 3 (residential/legendary)"],
                    ["Legacy head-start", "25% of your legacy score"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between" style={{ color: "#9e8f7a" }}>
                      <span>{k}</span><span style={{ color: "#c4b5fd" }}>{v}</span>
                    </div>
                  ))}
                  {state.mysticalPath !== "none" && (
                    <div className="flex justify-between" style={{ color: "#9e8f7a" }}>
                      <span>Mystical talent</span>
                      <span style={{ color: "#c4b5fd" }}>
                        Tier {Math.floor(state.mysticalTier * 0.4)} {state.mysticalPath.replace("_"," ")}
                      </span>
                    </div>
                  )}
                </div>

                <button onClick={() => setShowChildPicker(false)}
                  className="w-full h-10 rounded-xl border text-sm transition-colors"
                  style={{ borderColor: "rgba(135,135,146,0.2)", color: "#878792" }}>
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── REINCARNATE MODAL ───────────────────────── */}
      <AnimatePresence>
        {showReincarnateModal && (
          <>
            <motion.div className="fixed inset-0 z-40 backdrop-blur-sm bg-black/70"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowReincarnateModal(false)} />
            <motion.div
              className="fixed inset-x-4 top-1/2 z-50 rounded-2xl overflow-hidden"
              style={{ background: "#1d2024", border: "1px solid rgba(128,192,255,0.3)", boxShadow: "0 0 60px rgba(128,192,255,0.12)", maxWidth: 440, margin: "0 auto" }}
              initial={{ opacity: 0, scale: 0.92, y: "-40%" }}
              animate={{ opacity: 1, scale: 1, y: "-50%" }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: "spring", damping: 22, stiffness: 300 }}>

              <div className="px-5 py-3 label-caps"
                style={{ background: "rgba(128,192,255,0.07)", color: "#80c0ff", borderBottom: "1px solid rgba(128,192,255,0.15)" }}>
                ✦ Soul Reincarnation
              </div>

              <div className="px-5 py-4">
                <p className="text-sm mb-4" style={{ color: "#9e8f7a" }}>
                  Your soul carries memories across lifetimes. A new character — but past-life bonuses persist.
                </p>

                <div className="p-3 rounded-lg text-xs space-y-1.5 mb-4"
                  style={{ background: "rgba(128,192,255,0.05)", border: "1px solid rgba(128,192,255,0.15)" }}>
                  <div className="font-semibold mb-2" style={{ color: "#80c0ff" }}>
                    Soul Memory Bonuses (Gen {state.generation + 1})
                  </div>
                  {[
                    ["Starting stats", `+15% of ${state.name}'s stats`],
                    ["Legacy head-start", "12% of your legacy"],
                    ["Achievement", "Reincarnated (unlocked)"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between" style={{ color: "#9e8f7a" }}>
                      <span>{k}</span><span style={{ color: "#67e8f9" }}>{v}</span>
                    </div>
                  ))}
                  {state.mysticalPath !== "none" && (
                    <div className="flex justify-between" style={{ color: "#9e8f7a" }}>
                      <span>Awakened talent</span>
                      <span style={{ color: "#67e8f9" }}>
                        Tier {reincarnationTier} {state.mysticalPath.replace("_"," ")}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-xs italic text-center mb-4" style={{ color: "#878792" }}>
                  You can choose a new name, bloodline, and realm.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setShowReincarnateModal(false)}
                    className="h-12 rounded-xl border font-serif transition-all"
                    style={{ borderColor: "rgba(135,135,146,0.25)", color: "#878792" }}>
                    Not Yet
                  </button>
                  <button onClick={handleReincarnate}
                    className="h-12 rounded-xl font-serif font-bold transition-all"
                    style={{
                      background: "linear-gradient(135deg, rgba(6,78,118,0.9), rgba(2,44,80,0.9))",
                      color: "#67e8f9",
                      border: "1px solid rgba(128,192,255,0.4)",
                      boxShadow: "0 4px 20px rgba(128,192,255,0.25)",
                    }}>
                    Reincarnate ✦
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
