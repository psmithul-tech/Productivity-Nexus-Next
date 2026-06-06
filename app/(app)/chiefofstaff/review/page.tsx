"use client";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

export default function WeeklyReviewPage() {
  const [data, setData] = useState<{ text: string; stats: any } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReview() {
      try {
        const res = await fetch("/api/review");
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setData(json);
      } catch (e) {
        toast.error("Could not generate review");
      } finally {
        setLoading(false);
      }
    }
    fetchReview();
  }, []);

  const weekNumber = getWeekNumber(new Date());

  return (
    <div className="flex-1 overflow-y-auto page-enter px-4 md:px-8 py-8 custom-scrollbar">
      <div className="max-w-container-max mx-auto flex flex-col gap-8 md:gap-12">
        
        {/* Header Area */}
        <div className="flex flex-row justify-between items-end gap-6 mb-2">
          <header className="flex flex-col gap-3">
            <h1 className="text-[28px] font-headline-md font-bold text-on-surface flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FAF5F0] dark:bg-surface-container flex items-center justify-center border-[2px] border-black dark:border-[#E8DCC8] shrink-0 shadow-[0_2px_0_0_#000] dark:shadow-none">
                <span className="material-symbols-outlined text-[#EF476F] dark:text-primary text-[20px]">insights</span>
              </div>
              Executive Review
            </h1>
            <p className="text-on-surface-variant font-body-lg">
              WEEK {weekNumber} // RETROSPECTIVE ANALYSIS
            </p>
          </header>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <span className="material-symbols-outlined animate-spin text-[48px] text-primary">sync</span>
            <p className="font-mono-label text-mono-label text-primary tracking-widest uppercase animate-pulse">Running systemic analysis...</p>
          </div>
        ) : !data ? (
          <div className="text-center py-20 text-on-surface-variant border border-dashed border-outline-variant/30 rounded-[2rem]">
            Failed to load telemetry data.
          </div>
        ) : (
          <>
            {/* Card 1: Highlights */}
            <section className="bg-white dark:bg-surface border-[3px] border-black dark:border-outline-variant/20 rounded-[32px] p-6 lg:p-8 shadow-[0_4px_0_0_#000] dark:shadow-sm flex flex-col gap-6">
              <div className="flex items-center gap-2 border-b-[3px] border-black dark:border-outline-variant/10 pb-4">
                <span className="material-symbols-outlined text-[#EF476F] dark:text-primary text-xl">insights</span>
                <h2 className="font-headline-sm text-xl font-bold text-on-surface">System Highlights</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
                <div className="bg-[#F0F4F8] dark:bg-surface-container border-[2px] border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-none rounded-2xl p-6 flex flex-col justify-between">
                  <span className="font-mono-label text-xs tracking-wider text-on-surface-variant block mb-4 uppercase">TASKS COMPLETED</span>
                  <div className="flex items-end gap-2">
                    <span className="font-headline-lg text-4xl font-black leading-none">{data.stats?.tasks || 0}</span>
                  </div>
                  <div className="mt-4 text-on-surface-variant text-sm flex items-center gap-1.5 font-medium">
                    <span className="material-symbols-outlined text-[18px] text-[#06D6A0] dark:text-primary">check_circle</span> Operational
                  </div>
                </div>

                <div className="bg-[#F0F4F8] dark:bg-surface-container border-[2px] border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-none rounded-2xl p-6 flex flex-col justify-between">
                  <span className="font-mono-label text-xs tracking-wider text-on-surface-variant block mb-4 uppercase">DEEP WORK</span>
                  <div className="flex items-end gap-2">
                    <span className="font-headline-lg text-4xl font-black leading-none">{Math.round((data.stats?.focusMinutes || 0) / 60 * 10) / 10}</span>
                    <span className="font-mono-label text-sm text-on-surface-variant mb-1 uppercase">hrs</span>
                  </div>
                  <div className="mt-4 text-on-surface-variant text-sm flex items-center gap-1.5 font-medium">
                    <span className="material-symbols-outlined text-[18px] text-[#118AB2] dark:text-primary">timer</span> Focused
                  </div>
                </div>

                <div className="bg-[#F0F4F8] dark:bg-surface-container border-[2px] border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-none rounded-2xl p-6 flex flex-col justify-between">
                  <span className="font-mono-label text-xs tracking-wider text-on-surface-variant block mb-4 uppercase">PROCESSES LOGGED</span>
                  <div className="flex items-end gap-2">
                    <span className="font-headline-lg text-4xl font-black leading-none">{data.stats?.habits || 0}</span>
                  </div>
                  <div className="mt-4 text-on-surface-variant text-sm flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#EF476F] dark:bg-primary animate-pulse ml-0.5 mr-0.5"></span> Tracking Active
                  </div>
                </div>
              </div>
            </section>

            {/* Card 2: Analysis */}
            <section className="bg-white dark:bg-surface border-[3px] border-black dark:border-outline-variant/20 rounded-[32px] p-6 lg:p-8 shadow-[0_4px_0_0_#000] dark:shadow-sm flex flex-col gap-6">
              <div className="flex items-center gap-2 border-b-[3px] border-black dark:border-outline-variant/10 pb-4 relative z-10">
                <span className="material-symbols-outlined text-[#118AB2] dark:text-primary text-xl">analytics</span>
                <h2 className="font-headline-sm text-xl font-bold text-on-surface">Deep Analysis</h2>
              </div>
              
              <div className="flex flex-col md:flex-row gap-8 mt-2 relative z-10">
                <div className="flex-1 space-y-4">
                  <div className="prose prose-p:text-on-surface-variant prose-strong:text-on-surface prose-strong:font-bold prose-h1:text-on-surface prose-h2:text-on-surface prose-h3:text-on-surface max-w-none prose-ul:text-on-surface-variant prose-li:text-on-surface-variant">
                    <ReactMarkdown>{data.text}</ReactMarkdown>
                  </div>
                </div>

                <div className="w-full md:w-64 bg-[#F0F4F8] dark:bg-surface-container border-[2px] border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-none rounded-2xl p-6 flex flex-col items-center justify-center shrink-0 mt-4 md:mt-0 gap-4">
                  <span className="material-symbols-outlined text-[48px] text-black dark:text-primary opacity-80">psychiatry</span>
                  <span className="font-mono-label text-xs tracking-widest text-on-surface-variant uppercase text-center">AI Synthesis<br/>Complete</span>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function getWeekNumber(d: Date) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  var weekNo = Math.ceil(( ( (d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
  return weekNo;
}
