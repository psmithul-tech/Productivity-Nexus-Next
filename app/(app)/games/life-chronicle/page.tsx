"use client";

import "@/components/games/life-chronicle/life-chronicle.css";
import App from "@/components/games/life-chronicle/App";

export default function LifeChroniclePage() {
  return (
    <div className="flex-1 w-full h-full flex flex-col bg-white dark:bg-[#050505] relative overflow-hidden custom-scrollbar p-4 md:p-6 lg:p-8">
      <div className="relative overflow-hidden rounded-[32px] bg-[#F0F4F8] dark:bg-surface-container-lowest border-[3px] border-black dark:border-transparent shadow-[0_4px_0_0_#000] dark:shadow-lg flex flex-col h-full flex-1 items-center">
        <div className="w-full h-full max-w-[1400px] relative flex-1">
          <App />
        </div>
      </div>
    </div>
  );
}
