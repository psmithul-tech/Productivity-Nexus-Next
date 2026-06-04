"use client";
import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Zap, Target } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

type DailyStat = {
  date: string;
  tasks: number;
  focus: number; // minutes
};

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      // Mock data generator for the last 7 days since complex aggregations in PG might be overkill for this prototype.
      // In a real app we'd fetch from an API route that groups by date.
      const days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
          date: d.toLocaleDateString("en-US", { weekday: "short" }),
          tasks: Math.floor(Math.random() * 8) + 2,
          focus: Math.floor(Math.random() * 120) + 30,
        };
      });
      setStats(days);
      setLoading(false);
    }
    fetchStats();
  }, []);

  const maxTasks = Math.max(...stats.map(s => s.tasks), 10);
  const maxFocus = Math.max(...stats.map(s => s.focus), 150);

  return (
    <div className="relative min-h-screen pb-12">
      <div className="fixed top-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-purple-500/10 blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-400" /> Analytics
          </h1>
          <p className="text-white/40 mt-1">Your productivity trends over the last 7 days.</p>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3 text-white/50 mb-4">
              <Target className="h-5 w-5 text-blue-400" />
              <h3 className="font-bold text-sm uppercase tracking-wider">Total Focus Time</h3>
            </div>
            <p className="text-4xl font-black text-white">{Math.round(stats.reduce((a, b) => a + b.focus, 0) / 60 * 10) / 10}h</p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <TrendingUp className="h-3 w-3" /> +12% from last week
            </div>
          </div>
          
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3 text-white/50 mb-4">
              <Zap className="h-5 w-5 text-purple-400" />
              <h3 className="font-bold text-sm uppercase tracking-wider">Tasks Completed</h3>
            </div>
            <p className="text-4xl font-black text-white">{stats.reduce((a, b) => a + b.tasks, 0)}</p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <TrendingUp className="h-3 w-3" /> +5% from last week
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tasks Chart */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl h-[400px] flex flex-col">
            <h3 className="font-bold text-white mb-6">Tasks Completion Trend</h3>
            <div className="flex-1 flex items-end justify-between gap-2 pb-2">
              {stats.map((stat, i) => (
                <div key={i} className="flex flex-col items-center flex-1 gap-3">
                  <div className="w-full relative flex justify-center group h-[250px] items-end">
                    <div 
                      className="w-full max-w-[40px] bg-gradient-to-t from-purple-500/20 to-purple-400 rounded-t-xl transition-all duration-700 group-hover:opacity-80"
                      style={{ height: `${(stat.tasks / maxTasks) * 100}%` }}
                    />
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white text-xs px-2 py-1 rounded-md font-bold backdrop-blur-md">
                      {stat.tasks}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-white/40">{stat.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Focus Chart */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl h-[400px] flex flex-col">
            <h3 className="font-bold text-white mb-6">Deep Work (Minutes)</h3>
            <div className="flex-1 flex items-end justify-between gap-2 pb-2">
              {stats.map((stat, i) => (
                <div key={i} className="flex flex-col items-center flex-1 gap-3">
                  <div className="w-full relative flex justify-center group h-[250px] items-end">
                    <div 
                      className="w-full max-w-[40px] bg-gradient-to-t from-blue-500/20 to-blue-400 rounded-t-xl transition-all duration-700 group-hover:opacity-80"
                      style={{ height: `${(stat.focus / maxFocus) * 100}%` }}
                    />
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white text-xs px-2 py-1 rounded-md font-bold backdrop-blur-md">
                      {stat.focus}m
                    </div>
                  </div>
                  <span className="text-xs font-bold text-white/40">{stat.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
