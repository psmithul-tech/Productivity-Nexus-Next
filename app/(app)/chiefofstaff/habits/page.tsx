"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { toast } from "sonner";

type Habit = {
  id: number;
  name: string;
  frequency: string;
  color: string;
};

type HabitLog = {
  id: number;
  habitId: number;
  date: string;
  completed: boolean;
};

const PAST_DAYS = 364; // Exactly 52 weeks * 7 days
const MINI_HISTORY_DAYS = 7;

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("emerald");
  const [newFrequency, setNewFrequency] = useState("Daily");
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate last N days for annual aggregate
  const dates = useMemo(() => Array.from({ length: PAST_DAYS }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (PAST_DAYS - 1 - i));
    return d.toISOString().split("T")[0];
  }), []);

  // Last 7 days for mini history
  const miniHistoryDates = useMemo(() => Array.from({ length: MINI_HISTORY_DAYS }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (MINI_HISTORY_DAYS - 1 - i));
    return d.toISOString().split("T")[0];
  }), []);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [logs]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/habits");
      const data = await res.json();
      
      setHabits(Array.isArray(data.habits) ? data.habits : []);
      setLogs(Array.isArray(data.logs) ? data.logs : []);
    } catch {
      toast.error("Failed to load habits");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, color: newColor, frequency: newFrequency }),
      });
      setNewName("");
      setShowAdd(false);
      fetchData();
      toast.success("Habit created!");
    } catch {
      toast.error("Failed to create habit");
    }
  }

  async function toggleLog(habitId: number, date: string) {
    // Optimistic update
    const existing = logs.find(l => l.habitId === habitId && l.date === date);
    if (existing) {
      setLogs(logs.map(l => l.id === existing.id ? { ...l, completed: !l.completed } : l));
    } else {
      setLogs([...logs, { id: Date.now(), habitId, date, completed: true }]);
    }

    try {
      const res = await fetch(`/api/habits/${habitId}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      const data = await res.json();
      
      // Sync with real data
      setLogs(prev => {
        const filtered = prev.filter(l => !(l.habitId === habitId && l.date === date));
        return [...filtered, data];
      });
    } catch {
      toast.error("Failed to update process log");
      fetchData(); // revert
    }
  }

  const COLORS: Record<string, string> = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
    rose: "bg-rose-500",
    cyan: "bg-primary",
  };

  // Analytics Math
  const activeStreaks = habits.reduce((acc, h) => {
    // check if today or yesterday is completed
    const todayLog = logs.find(l => l.habitId === h.id && l.date === todayStr && l.completed);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const yesterdayLog = logs.find(l => l.habitId === h.id && l.date === yesterdayStr && l.completed);
    if (todayLog || yesterdayLog) return acc + 1;
    return acc;
  }, 0);

  const completionsLast7Days = logs.filter(l => miniHistoryDates.includes(l.date) && l.completed).length;
  const avgCompletion = habits.length > 0 ? (completionsLast7Days / habits.length).toFixed(1) : "0.0";
  const systemConsistency = habits.length > 0 ? ((completionsLast7Days / (habits.length * 7)) * 100).toFixed(1) : "0.0";

  // Annual aggregate density array (52 weeks x 7 days)
  // Let's build a simple matrix based on actual logs
  // Each day gets an intensity 0-4
  const aggregateCounts = dates.map(d => {
    return logs.filter(l => l.date === d && l.completed).length;
  });
  const maxAggregate = Math.max(...aggregateCounts, 1);

  return (
    <div className="flex-1 overflow-y-auto page-enter px-4 md:px-8 py-8 custom-scrollbar">
      <div className="max-w-container-max mx-auto flex flex-col gap-8 md:gap-12">
        {/* Header & Action Area */}
        <div className="flex flex-row justify-between items-end gap-6 mb-2">
          <header className="flex flex-col gap-3">
            <h1 className="text-[28px] font-headline-md font-bold text-on-surface flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FAF5F0] flex items-center justify-center border border-[#E8DCC8] shrink-0">
                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
              </div>
              Habits
            </h1>
            <p className="text-on-surface-variant font-body-lg">
              Daily Progress Tracker
            </p>
          </header>
          <button 
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1 text-on-surface font-bold text-sm border-b-2 border-outline-variant/30 hover:border-primary transition-colors pb-1 mb-1"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Habit
          </button>
        </div>

        {/* Add Habit Form */}
        {showAdd && (
          <div className="bg-white dark:bg-surface border-[3px] border-black dark:border-outline-variant/20 rounded-full py-2 pr-6 pl-2 flex items-center relative shadow-[0_4px_0_0_#000] dark:shadow-none h-[72px]">
            <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-primary rounded-l-full"></div>
            <form onSubmit={handleAdd} className="flex flex-row gap-4 items-center pl-4 w-full h-full">
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Habit name (e.g. Daily Standup)"
                className="flex-1 bg-[#F0F4F8] border-none text-on-surface px-5 h-full rounded-xl focus:outline-none placeholder-on-surface-variant/40 font-body-lg text-[15px]"
              />
              <input
                value={newFrequency}
                onChange={e => setNewFrequency(e.target.value)}
                placeholder="Daily"
                className="w-48 bg-[#F0F4F8] border-none text-on-surface px-5 h-full rounded-xl focus:outline-none placeholder-on-surface-variant/40 font-body-lg text-[15px]"
              />
              <div className="flex gap-2 items-center px-2">
                {Object.keys(COLORS).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={`h-9 w-9 rounded-full shrink-0 ${COLORS[c]} ${newColor === c ? 'border-2 border-on-surface shadow-md scale-110' : 'opacity-80 hover:opacity-100 hover:scale-105 transition-all'}`}
                  />
                ))}
              </div>
              <button type="submit" className="text-on-surface font-bold text-[13px] border-b-[1.5px] border-outline-variant/40 hover:border-primary transition-colors pb-0.5 ml-2">
                Create
              </button>
            </form>
          </div>
        )}

        {/* Dashboard Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Analytics Summary (Col span 4) */}
          <div className="lg:col-span-4 bg-white dark:bg-surface border-[3px] border-black dark:border-outline-variant/20 rounded-[32px] p-6 lg:p-8 flex flex-col justify-between shadow-[0_4px_0_0_#000] dark:shadow-none">
            <div>
              <div className="font-headline-sm text-lg font-bold text-on-surface flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#FAF5F0] flex items-center justify-center border border-[#E8DCC8] shrink-0">
                  <span className="material-symbols-outlined text-primary text-[20px]">analytics</span>
                </div>
                Consistency
              </div>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-[44px] font-bold text-primary tracking-tight">{systemConsistency}%</span>
              </div>
            </div>
            
            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-center px-5 py-3.5 bg-[#F0F4F8] rounded-xl">
                <span className="text-[14px] text-on-surface-variant">Active Streaks</span>
                <span className="font-bold text-[15px] text-on-surface">{activeStreaks}</span>
              </div>
              <div className="flex justify-between items-center px-5 py-3.5 bg-[#F0F4F8] rounded-xl">
                <span className="text-[14px] text-on-surface-variant">Avg Completion (7d)</span>
                <span className="font-bold text-[15px] text-on-surface">{avgCompletion}/7</span>
              </div>
              <div className="flex justify-between items-center px-5 py-3.5 bg-[#F0F4F8] rounded-xl">
                <span className="text-[14px] text-on-surface-variant">Status</span>
                <div className="flex items-center gap-2 bg-[#E8DCC8]/40 px-3 py-1 rounded-md border border-[#E8DCC8]">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-sm"></div>
                  <span className="font-bold text-[11px] text-primary uppercase tracking-wider">On Track</span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Habits List (Col span 8) */}
          <div className="lg:col-span-8 bg-white dark:bg-surface border-[3px] border-black dark:border-outline-variant/20 rounded-[32px] p-6 lg:p-8 shadow-[0_4px_0_0_#000] dark:shadow-none">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-headline-sm text-lg font-bold text-on-surface flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F0F4F8] flex items-center justify-center border border-[#E0E8F0] shrink-0">
                  <span className="material-symbols-outlined text-on-surface-variant text-[20px]">format_list_bulleted</span>
                </div>
                Active Habits
              </h3>
              <span className="font-bold text-[11px] text-primary bg-[#E8F0FE] px-4 py-1.5 rounded-xl border border-[#D0E0FD] uppercase tracking-wider">TODAY</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loading ? (
                <div className="col-span-2 py-16 flex justify-center text-primary">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : habits.length === 0 ? (
                <div className="col-span-2 py-16 flex flex-col items-center justify-center text-on-surface-variant bg-surface-container-high/20 rounded-3xl border-2 border-dashed border-outline-variant/30">
                  <span className="material-symbols-outlined text-[64px] opacity-30 mb-4">dashboard_customize</span>
                  <span className="font-headline-sm text-xl font-bold">No habits created</span>
                  <span className="text-on-surface-variant/70 mt-2">Click New Habit to get started</span>
                </div>
              ) : (
                habits.map(habit => {
                  const todayCompleted = logs.some(l => l.habitId === habit.id && l.date === todayStr && l.completed);
                  // Calculate streak
                  let streak = 0;
                  for (let i = 0; i < PAST_DAYS; i++) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const ds = d.toISOString().split("T")[0];
                    if (logs.some(l => l.habitId === habit.id && l.date === ds && l.completed)) {
                      streak++;
                    } else if (i !== 0) { // allow missing today
                      break;
                    }
                  }

                  return (
                    <div key={habit.id} className="bg-white dark:bg-surface border-[2px] border-black dark:border-outline-variant/30 rounded-[20px] p-5 hover:bg-gray-50 dark:hover:bg-[#F0F4F8]/30 transition-all group relative overflow-hidden flex flex-col justify-between min-h-[160px] shadow-[0_3px_0_0_#000] dark:shadow-none hover:translate-y-[2px] hover:shadow-[0_1px_0_0_#000] dark:hover:shadow-none cursor-pointer">
                      <div className={`absolute left-0 top-0 bottom-0 w-2.5 transition-colors rounded-l-[20px] ${todayCompleted ? 'bg-primary' : 'bg-transparent'}`}></div>
                      
                      <div className="flex justify-between items-start mb-6 pl-2">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl border-[1.5px] flex items-center justify-center transition-colors ${todayCompleted ? 'bg-[#FAF5F0] border-[#E8DCC8] text-primary' : 'bg-surface border-outline-variant/30 text-outline-variant/70'}`}>
                            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>{todayCompleted ? 'check_circle' : 'circle'}</span>
                          </div>
                          <div>
                            <div className="font-headline-sm text-[17px] font-bold text-on-surface truncate max-w-[140px]" title={habit.name}>{habit.name}</div>
                            <div className="font-body-lg text-on-surface-variant/80 font-medium text-[13px]">{habit.frequency || 'daily'}</div>
                          </div>
                        </div>
                        <div className={`font-bold text-[12px] px-2.5 py-1 rounded-lg border ${streak > 0 ? 'bg-orange-50 text-[#D97706] border-orange-100' : 'bg-[#F0F4F8] text-on-surface-variant border-[#E0E8F0]'}`}>
                          {streak} 🔥
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-auto pl-2">
                        <div className="flex gap-[6px]">
                          {miniHistoryDates.map((date, idx) => {
                            const isCompleted = logs.some(l => l.habitId === habit.id && l.date === date && l.completed);
                            const isToday = date === todayStr;
                            if (isToday) return null; // We handle today with the big button
                            return (
                              <div 
                                key={date} 
                                title={date}
                                className={`w-[10px] h-5 rounded-sm transition-colors ${
                                  isCompleted ? 'bg-[#A68051]' : 'bg-[#F0F4F8]'
                                }`}
                              ></div>
                            );
                          })}
                          <div className={`w-[10px] h-5 rounded-sm transition-colors ${todayCompleted ? 'bg-[#8C6239]' : 'bg-[#F0F4F8]'}`}></div>
                        </div>
                        <button 
                          onClick={() => toggleLog(habit.id, todayStr)}
                          className={`w-11 h-11 rounded-2xl border-[1.5px] flex items-center justify-center transition-all ${
                            todayCompleted 
                              ? 'border-[#8C6239] bg-[#8C6239] text-white shadow-md' 
                              : 'border-[#E0E8F0] bg-surface hover:bg-[#F0F4F8] text-outline-variant/40'
                          }`}
                        >
                          {todayCompleted ? (
                            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 0" }}>check</span>
                          ) : (
                            <div className="w-2.5 h-2.5 rounded-full bg-outline-variant/20"></div>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Contribution Heat Map */}
        <div className="bg-white dark:bg-surface border-[3px] border-black dark:border-outline-variant/20 rounded-[32px] p-8 shadow-[0_4px_0_0_#000] dark:shadow-none w-full overflow-x-auto mb-12">
          <div className="flex justify-between items-center mb-8 min-w-[800px]">
            <h3 className="font-headline-sm text-2xl font-bold text-on-surface flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-outline-variant/10 flex items-center justify-center border border-outline-variant/20 shrink-0">
                <span className="material-symbols-outlined text-on-surface-variant">calendar_month</span>
              </div>
              Activity Heatmap
            </h3>
            <div className="flex items-center gap-3 font-bold text-sm text-on-surface-variant bg-surface-container-high/50 px-4 py-2 rounded-xl border border-outline-variant/20">
              <span>Less</span>
              <div className="flex gap-1.5">
                <div className="w-4 h-4 bg-[#F0F4F8] rounded-sm"></div>
                <div className="w-4 h-4 bg-[#E2CBB0] rounded-sm"></div>
                <div className="w-4 h-4 bg-[#C4A47C] rounded-sm"></div>
                <div className="w-4 h-4 bg-[#A68051] rounded-sm"></div>
                <div className="w-4 h-4 bg-[#8C6239] shadow-sm rounded-sm"></div>
              </div>
              <span>More</span>
            </div>
          </div>

          <div ref={scrollRef} className="flex gap-2 min-w-[800px] overflow-x-auto pb-6 custom-scrollbar items-start mt-2 scroll-smooth">
            {/* Months labels (simplified) */}
            <div className="flex flex-col gap-[14px] w-8 mr-2 mt-[22px] font-bold text-[10px] text-on-surface-variant opacity-70">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>
            {/* Grid columns (52 weeks) - properly ordered left to right (oldest to newest) */}
            <div className="flex gap-2 flex-1">
              {Array.from({ length: 52 }).map((_, w) => (
                <div key={w} className="flex flex-col gap-2">
                  {Array.from({ length: 7 }).map((_, d) => {
                    const dayIndex = w * 7 + d;
                    if (dayIndex >= dates.length) return null;
                    const date = dates[dayIndex]; // Ordered oldest -> newest
                    const intensityVal = aggregateCounts[dayIndex];
                    let intensityClass = "bg-[#F0F4F8]";
                    if (intensityVal > 0) {
                      const ratio = intensityVal / maxAggregate;
                      if (ratio > 0.75) intensityClass = "bg-[#8C6239] shadow-sm";
                      else if (ratio > 0.5) intensityClass = "bg-[#A68051]";
                      else if (ratio > 0.25) intensityClass = "bg-[#C4A47C]";
                      else intensityClass = "bg-[#E2CBB0]";
                    }
                    return (
                      <div 
                        key={d} 
                        title={`${date}: ${intensityVal} habits`}
                        className={`w-4 h-4 rounded-md ${intensityClass} hover:ring-2 hover:ring-primary hover:scale-125 transition-all cursor-crosshair z-10 hover:z-20`}
                      ></div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
