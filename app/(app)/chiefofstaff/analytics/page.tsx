"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type DailyStat = {
  date: string;
  tasks: number;
  focus: number; // minutes
  habits?: number;
};

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/analytics");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const maxTasks = Math.max(...stats.map(s => s.tasks), 10);
  const maxFocus = Math.max(...stats.map(s => s.focus), 150);

  return (
    <div className="flex-1 overflow-y-auto page-enter px-4 md:px-8 py-8 custom-scrollbar">
      <div className="max-w-container-max mx-auto flex flex-col gap-8 md:gap-12">
        
        {/* Header Area */}
        <div className="flex flex-row justify-between items-end gap-6 mb-2">
          <header className="flex flex-col gap-3">
            <h1 className="text-[28px] font-headline-md font-bold text-on-surface flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FAF5F0] dark:bg-surface-container flex items-center justify-center border-[2px] border-black dark:border-[#E8DCC8] shrink-0 shadow-[0_2px_0_0_#000] dark:shadow-none">
                <span className="material-symbols-outlined text-[#118AB2] dark:text-primary text-[20px]">bar_chart</span>
              </div>
              System Analytics
            </h1>
            <p className="text-on-surface-variant font-body-lg">
              Productivity Telemetry [T-7 Days]
            </p>
          </header>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-surface border-[3px] border-black dark:border-outline-variant/20 rounded-[32px] p-6 lg:p-8 flex flex-col justify-between group hover:-translate-y-[2px] shadow-[0_4px_0_0_#000] dark:shadow-sm hover:shadow-[0_2px_0_0_#000] dark:hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono-label text-xs tracking-widest uppercase text-on-surface-variant">Total Focus Time</span>
              <span className="material-symbols-outlined text-[20px] text-primary">target</span>
            </div>
            <div className="flex items-end gap-2 mb-4">
              <span className="font-headline-lg text-4xl font-black leading-none group-hover:text-primary transition-colors">
                {Math.round(stats.reduce((a, b) => a + b.focus, 0) / 60 * 10) / 10}
              </span>
              <span className="text-xl text-on-surface-variant mb-1">h</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono-label text-xs uppercase tracking-wider text-[#118AB2] dark:text-primary bg-[#118AB2]/10 dark:bg-primary/10 px-3 py-1.5 rounded-full w-fit border-[2px] border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-none">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> +12% Delta
            </div>
          </div>
          
          <div className="bg-white dark:bg-surface border-[3px] border-black dark:border-outline-variant/20 rounded-[32px] p-6 lg:p-8 flex flex-col justify-between group hover:-translate-y-[2px] shadow-[0_4px_0_0_#000] dark:shadow-sm hover:shadow-[0_2px_0_0_#000] dark:hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono-label text-xs tracking-widest uppercase text-on-surface-variant">Tasks Executed</span>
              <span className="material-symbols-outlined text-[20px] text-accent-fixed">bolt</span>
            </div>
            <div className="flex items-end gap-2 mb-4">
              <span className="font-headline-lg text-4xl font-black leading-none group-hover:text-accent-fixed transition-colors">
                {stats.reduce((a, b) => a + b.tasks, 0)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono-label text-xs uppercase tracking-wider text-accent-fixed bg-accent-fixed/10 px-3 py-1.5 rounded-full w-fit border-[2px] border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-none">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> +5% Delta
            </div>
          </div>

          <div className="bg-white dark:bg-surface border-[3px] border-black dark:border-outline-variant/20 rounded-[32px] p-6 lg:p-8 flex flex-col justify-between group hover:-translate-y-[2px] shadow-[0_4px_0_0_#000] dark:shadow-sm hover:shadow-[0_2px_0_0_#000] dark:hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono-label text-xs tracking-widest uppercase text-on-surface-variant">Habit Integrity</span>
              <span className="material-symbols-outlined text-[20px] text-emerald-500">done_all</span>
            </div>
            <div className="flex items-end gap-2 mb-4">
              <span className="font-headline-lg text-4xl font-black leading-none group-hover:text-emerald-500 transition-colors">
                {stats.reduce((a, b) => a + (b.habits || 0), 0)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono-label text-xs uppercase tracking-wider text-[#06D6A0] dark:text-emerald-500 bg-[#06D6A0]/10 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full w-fit border-[2px] border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-none">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> Maintained
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tasks Chart */}
          <div className="bg-white dark:bg-surface border-[3px] border-black dark:border-outline-variant/20 rounded-[32px] p-6 shadow-[0_4px_0_0_#000] dark:shadow-sm h-[400px] flex flex-col">
            <h3 className="font-headline-sm text-[16px] text-accent-fixed font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">bolt</span> Task Velocity
            </h3>
            <div className="flex-1 flex items-end justify-between gap-2 pb-2">
              {stats.map((stat, i) => (
                <div key={i} className="flex flex-col items-center flex-1 gap-3">
                  <div className="w-full relative flex justify-center group h-[250px] items-end">
                    <div 
                      className="w-full max-w-[40px] bg-accent-fixed/20 rounded-t-xl transition-all duration-500 group-hover:bg-accent-fixed/80"
                      style={{ height: `${(stat.tasks / maxTasks) * 100}%` }}
                    />
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-surface border-[2px] border-black dark:border-outline-variant/20 text-accent-fixed font-mono-label text-xs px-2 py-1 rounded-lg shadow-[0_2px_0_0_#000] dark:shadow-sm">
                      {stat.tasks}
                    </div>
                  </div>
                  <span className="font-mono-label text-xs tracking-wider text-on-surface-variant">{stat.date.split('/')[0]}/{stat.date.split('/')[1]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Focus Chart */}
          <div className="bg-white dark:bg-surface border-[3px] border-black dark:border-outline-variant/20 rounded-[32px] p-6 shadow-[0_4px_0_0_#000] dark:shadow-sm h-[400px] flex flex-col">
            <h3 className="font-headline-sm text-[16px] text-[#118AB2] dark:text-primary font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">target</span> Deep Work Volume
            </h3>
            <div className="flex-1 flex items-end justify-between gap-2 pb-2">
              {stats.map((stat, i) => (
                <div key={i} className="flex flex-col items-center flex-1 gap-3">
                  <div className="w-full relative flex justify-center group h-[250px] items-end">
                    <div 
                      className="w-full max-w-[40px] bg-primary/20 rounded-t-xl transition-all duration-500 group-hover:bg-primary/80"
                      style={{ height: `${(stat.focus / maxFocus) * 100}%` }}
                    />
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-surface border-[2px] border-black dark:border-outline-variant/20 text-[#118AB2] dark:text-primary font-mono-label text-xs px-2 py-1 rounded-lg shadow-[0_2px_0_0_#000] dark:shadow-sm">
                      {stat.focus}m
                    </div>
                  </div>
                  <span className="font-mono-label text-xs tracking-wider text-on-surface-variant">{stat.date.split('/')[0]}/{stat.date.split('/')[1]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Habits Chart */}
          <div className="bg-white dark:bg-surface border-[3px] border-black dark:border-outline-variant/20 rounded-[32px] p-6 shadow-[0_4px_0_0_#000] dark:shadow-sm h-[400px] flex flex-col">
            <h3 className="font-headline-sm text-[16px] text-[#06D6A0] dark:text-emerald-500 font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">done_all</span> Habit Adherence
            </h3>
            <div className="flex-1 flex items-end justify-between gap-2 pb-2">
              {stats.map((stat, i) => (
                <div key={i} className="flex flex-col items-center flex-1 gap-3">
                  <div className="w-full relative flex justify-center group h-[250px] items-end">
                    <div 
                      className="w-full max-w-[40px] bg-emerald-500/20 rounded-t-xl transition-all duration-500 group-hover:bg-emerald-500/80"
                      style={{ height: `${(stat.habits ? (stat.habits / Math.max(...stats.map(s => s.habits || 0), 5)) * 100 : 0)}%` }}
                    />
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-surface border-[2px] border-black dark:border-outline-variant/20 text-[#06D6A0] dark:text-emerald-500 font-mono-label text-xs px-2 py-1 rounded-lg shadow-[0_2px_0_0_#000] dark:shadow-sm">
                      {stat.habits || 0}
                    </div>
                  </div>
                  <span className="font-mono-label text-xs tracking-wider text-on-surface-variant">{stat.date.split('/')[0]}/{stat.date.split('/')[1]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
