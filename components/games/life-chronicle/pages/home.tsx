import { useState } from "react";
import { useRouter, Link } from "../App";
import SaveManager from "../SaveManager";
import { useGame } from "@/lib/games/life-chronicle/engine/GameContext";
import { motion, AnimatePresence } from "framer-motion";
const basePath = "";

export default function Home() {
  const [showSaves, setShowSaves] = useState(false);
  const { navigate } = useRouter();
  const { state } = useGame();

  return (
    <div className="game-wrapper flex flex-col items-center justify-center relative overflow-y-auto custom-scrollbar px-4 bg-transparent text-on-surface dark:text-white transition-colors duration-300">
      
      {/* Background clouds pattern or simple decorative elements */}
      <div className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle at 20% 30%, white 10%, transparent 10%), radial-gradient(circle at 80% 60%, white 15%, transparent 15%)",
          backgroundSize: "200px 200px"
        }} />

      <div className="w-full max-w-xl flex flex-col items-center relative z-10">

        {/* ── Logo ─────────────────────────────────────── */}
        <motion.div className="text-center mb-8"
          initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}>
          
          <h1 className="text-5xl text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.4)] font-black tracking-widest"
              style={{ WebkitTextStroke: "1px rgba(0,0,0,0.5)" }}>
            CHRONICLE
          </h1>
          <p className="text-gray-500 dark:text-[#a1a1aa] italic font-serif mt-3 mb-4 text-sm">A life lived in shadows.</p>
          <div className="flex items-center justify-center gap-2 text-yellow-600/70 text-[10px] mb-5">
            <span>◈</span>
            <span>✦</span>
            <span>⨯</span>
            <span>✦</span>
            <span>◈</span>
          </div>
          
          <div className="text-gray-500 dark:text-[#a1a1aa] font-bold text-[10px] tracking-widest uppercase">
            10 realms · 12 bloodlines · infinite choices
          </div>
        </motion.div>

        {/* ── Action Buttons ────────────────────────────── */}
        <motion.div className="w-full space-y-4"
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}>

          {/* User Badge */}
          <div className="w-full bg-white dark:bg-[#1e1e24] border border-gray-200 dark:border-[#333] shadow-sm dark:shadow-none rounded-xl p-3 flex items-center gap-3 mb-6 transition-colors duration-300">
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#3f3f46] text-[#eab308] flex items-center justify-center font-bold text-sm">N</div>
            <div className="flex flex-col text-left">
              <span className="text-gray-900 dark:text-[#f4f4f5] text-sm font-bold">Nexus User</span>
              <span className="text-gray-500 dark:text-[#a1a1aa] text-[10px] uppercase tracking-wider">Cloud saves active via Nexus OS</span>
            </div>
          </div>

          {/* Continue game */}
          {state?.isAlive && (
            <Link href="/game" className="block w-full">
              <button className="w-full py-4 rounded-xl bg-blue-500 hover:bg-blue-600 dark:bg-[#3b82f6] dark:hover:bg-[#2563eb] text-white font-bold text-lg flex items-center justify-center gap-2 transition-colors">
                <span>▶</span> Continue {state.name} ({state.age})
              </button>
            </Link>
          )}

          {/* New Life — primary CTA */}
          <Link href="/create" className="block w-full">
            <button className="w-full py-4 rounded-xl bg-[#eab308] hover:bg-[#ca8a04] text-black font-bold text-lg flex items-center justify-center gap-2 transition-colors shadow-sm">
              <span>✦</span> Forge a New Life
            </button>
          </Link>

          <button
            onClick={() => setShowSaves(true)}
            className="w-full py-3 rounded-xl bg-white dark:bg-[#1e1e24] border border-gray-200 dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#27272a] text-blue-600 dark:text-[#bfdbfe] font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm dark:shadow-none">
            <span>☁</span> Cloud Saves
          </button>

          <Link href="/leaderboard" className="block w-full">
            <button className="w-full py-3 rounded-xl bg-white dark:bg-[#1e1e24] border border-gray-200 dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#27272a] text-yellow-600 dark:text-[#eab308] font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm dark:shadow-none">
              <span>⨯</span> Hall of Legends
            </button>
          </Link>

          <Link href="/achievements" className="block w-full">
            <button className="w-full py-3 rounded-xl bg-white dark:bg-[#1e1e24] border border-gray-200 dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#27272a] text-gray-700 dark:text-[#a1a1aa] font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm dark:shadow-none">
              <span>✶</span> Achievements
            </button>
          </Link>
          
          <div className="mt-8 text-center text-gray-400 dark:text-[#52525b] text-[10px] font-bold tracking-widest uppercase">
            Every life is a story
          </div>

        </motion.div>

      </div>

      {/* Save Manager Modal */}
      <AnimatePresence>
        {showSaves && <SaveManager onClose={() => setShowSaves(false)} onLoad={() => navigate("game")} />}
      </AnimatePresence>
    </div>
  );
}
