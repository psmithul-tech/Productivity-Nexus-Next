import { useEffect, useState } from "react";
import { listAchievements } from "../lib/actions";
import { useRouter } from "../App";
import { generatePlayerId } from "@/lib/games/life-chronicle/engine/cloudSave";
import { motion } from "framer-motion";

const RARITY_STYLES: Record<string, { border: string; text: string; bg: string; glow: string }> = {
  Bronze:   { border: "border-amber-700/50",  text: "text-amber-600",  bg: "bg-amber-900/20",  glow: "" },
  Silver:   { border: "border-slate-400/50",  text: "text-slate-300",  bg: "bg-slate-800/20",  glow: "" },
  Gold:     { border: "border-yellow-400/60", text: "text-yellow-300", bg: "bg-yellow-900/20", glow: "drop-shadow(0 0 6px rgba(250,200,50,0.4))" },
  Platinum: { border: "border-cyan-400/60",   text: "text-cyan-300",   bg: "bg-cyan-900/20",   glow: "drop-shadow(0 0 8px rgba(100,220,255,0.4))" },
  Legendary:{ border: "border-violet-400/60", text: "text-violet-300", bg: "bg-violet-900/20", glow: "drop-shadow(0 0 12px rgba(160,100,255,0.5))" },
};

export default function Achievements() {
  const playerId = generatePlayerId();
  const { navigate } = useRouter();
  const [achievements, setAchievements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    listAchievements(playerId).then(data => {
      setAchievements(data);
      setIsLoading(false);
    });
  }, [playerId]);

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar p-4" style={{ background: "hsl(220,30%,4%)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif text-primary glowing-text">Trophies of Fate</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {achievements?.length ?? 0} achievement{(achievements?.length ?? 0) !== 1 ? "s" : ""} unlocked
            </p>
          </div>
          <button className="flex items-center gap-2 text-sm transition-colors mb-6"
          style={{ color: "#878792" }}
          onClick={() => navigate("home")}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#d5c4ad")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#878792")}>
          <span className="text-lg">←</span> Return
        </button>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-4xl mb-4 rune-pulse">✦</div>
            Reading the stars...
          </div>
        ) : achievements?.length ? (
          <div className="space-y-3">
            {achievements.map((a: any, i: number) => {
              const style = RARITY_STYLES[a.rarity] ?? RARITY_STYLES.Bronze;
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-4 p-4 rounded-xl border ${style.border} ${style.bg}`}
                >
                  <div
                    className={`w-12 h-12 rounded-full border-2 ${style.border} flex items-center justify-center text-2xl shrink-0`}
                    style={{ filter: style.glow }}
                  >
                    ✵
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-serif font-bold ${style.text}`}>{a.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{a.description}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full border border-border/40 text-muted-foreground bg-muted/20">{a.category}</span>
                      <span className={`text-xs font-medium ${style.text}`}>{a.rarity}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 parchment rounded-xl">
            <div className="text-5xl mb-4 opacity-30">✵</div>
            <p className="text-muted-foreground">No achievements yet.<br />Live a life worth remembering.</p>
          </div>
        )}
      </div>
    </div>
  );
}
