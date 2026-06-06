import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CutsceneData } from "@/lib/games/life-chronicle/engine/types";

interface CutsceneOverlayProps {
  cutscene: CutsceneData;
  onChoice: (onClickId: string) => void;
}

export function CutsceneOverlay({ cutscene, onChoice }: CutsceneOverlayProps) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative w-full max-w-2xl bg-white border-[4px] border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] overflow-hidden rounded-xl"
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: "spring", bounce: 0.3 }}
        >
          {/* Top Bar / Title */}
          <div className="bg-[#FFD166] border-b-[4px] border-black p-4 text-center">
            <h2 className="font-heading font-black text-2xl md:text-3xl uppercase tracking-widest text-black drop-shadow-[2px_2px_0_rgba(255,255,255,1)]">
              {cutscene.title}
            </h2>
          </div>

          {/* Content Body */}
          <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center">
            {cutscene.image && (
              <div className="shrink-0 w-full md:w-1/2 rounded-xl border-[4px] border-black overflow-hidden shadow-[4px_4px_0_0_#000]">
                {/* We use an img tag, or it could be SVG, depending on how it's passed */}
                <img src={cutscene.image} alt="Cutscene graphic" className="w-full h-auto object-cover" />
              </div>
            )}
            <div className={`flex-1 ${cutscene.image ? "text-left" : "text-center"}`}>
              <p className="font-serif text-lg md:text-xl font-bold leading-relaxed text-gray-800">
                {cutscene.text}
              </p>
            </div>
          </div>

          {/* Choices Footer */}
          <div className="bg-gray-100 border-t-[4px] border-black p-4 flex flex-col gap-3">
            {cutscene.choices.map((choice, i) => (
              <motion.button
                key={i}
                onClick={() => onChoice(choice.onClickId)}
                className="w-full bg-white text-black font-black text-lg py-3 px-4 rounded-lg border-[3px] border-black shadow-[0_4px_0_0_#000] active:translate-y-[4px] active:shadow-none transition-all hover:bg-[#3E85E4] hover:text-white"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {choice.text}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
