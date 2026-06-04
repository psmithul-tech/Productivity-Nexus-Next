"use client";
import { useEffect, useState } from "react";
import { Flame, Plus, Loader2, Check } from "lucide-react";
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

const PAST_DAYS = 14;

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("emerald");

  // Generate last N days
  const dates = Array.from({ length: PAST_DAYS }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (PAST_DAYS - 1 - i));
    return d.toISOString().split("T")[0];
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [habitsRes, ...logsRes] = await Promise.all([
        fetch("/api/habits").then(r => r.json())
      ]);
      setHabits(Array.isArray(habitsRes) ? habitsRes : []);

      if (Array.isArray(habitsRes) && habitsRes.length > 0) {
        const allLogs = await Promise.all(
          habitsRes.map(h => fetch(`/api/habits/${h.id}/log`).then(r => r.json()))
        );
        setLogs(allLogs.flat());
      }
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
        body: JSON.stringify({ name: newName, color: newColor }),
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
      toast.error("Failed to update habit");
      fetchData(); // revert
    }
  }

  const COLORS: Record<string, string> = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
    rose: "bg-rose-500",
  };

  return (
    <div className="relative min-h-screen pb-12">
      <div className="fixed top-[10%] right-[10%] h-[500px] w-[500px] rounded-full bg-orange-500/10 blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Flame className="h-8 w-8 text-orange-500" /> Habits
            </h1>
            <p className="text-white/40 mt-1">Track your daily rituals and build streaks.</p>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all"
          >
            <Plus className="h-4 w-4" /> New Habit
          </button>
        </div>

        {showAdd && (
          <div className="mb-8 p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
            <h3 className="text-sm font-bold text-white mb-4">Create New Habit</h3>
            <form onSubmit={handleAdd} className="flex gap-4 items-center">
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Meditate for 10 minutes"
                className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
              />
              <div className="flex gap-2">
                {Object.keys(COLORS).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={`h-8 w-8 rounded-full ${COLORS[c]} ${newColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0f]' : 'opacity-50'}`}
                  />
                ))}
              </div>
              <button type="submit" className="px-6 py-2 rounded-xl bg-orange-500 text-white font-bold text-sm">
                Add
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : habits.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center opacity-50">
            <span className="text-4xl mb-2">🌱</span>
            <p className="text-white font-medium">No habits yet. Start small!</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden p-6">
            <div className="flex">
              {/* Habit Names Column */}
              <div className="w-48 shrink-0 pr-4 flex flex-col justify-end gap-3 pb-[18px]">
                {habits.map(h => (
                  <div key={h.id} className="h-10 flex items-center justify-end">
                    <span className="text-sm font-bold text-white/70 text-right truncate">{h.name}</span>
                  </div>
                ))}
              </div>

              {/* Grid Area */}
              <div className="flex-1 overflow-x-auto custom-scrollbar pb-2">
                <div className="flex gap-1.5 min-w-max">
                  {dates.map((date, i) => {
                    const d = new Date(date);
                    const isToday = i === dates.length - 1;
                    return (
                      <div key={date} className="flex flex-col items-center gap-3">
                        <div className="flex flex-col gap-1.5">
                          {habits.map(h => {
                            const isCompleted = logs.some(l => l.habitId === h.id && l.date === date && l.completed);
                            return (
                              <button
                                key={`${h.id}-${date}`}
                                onClick={() => toggleLog(h.id, date)}
                                className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
                                  isCompleted 
                                    ? `${COLORS[h.color]} shadow-lg ${COLORS[h.color].replace('bg-', 'shadow-')}/20` 
                                    : 'bg-white/5 border border-white/5 hover:bg-white/10'
                                }`}
                              >
                                {isCompleted && <Check className="h-5 w-5 text-white/90" />}
                              </button>
                            );
                          })}
                        </div>
                        {/* Date Label */}
                        <div className="text-[10px] text-white/30 text-center font-medium mt-1">
                          {isToday ? (
                            <span className="text-orange-400">Today</span>
                          ) : (
                            <>
                              {d.toLocaleDateString("en-US", { weekday: "short" })}<br/>
                              {d.getDate()}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
