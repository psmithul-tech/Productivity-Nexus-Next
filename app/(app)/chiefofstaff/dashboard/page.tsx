"use client";
import { useEffect, useState, useCallback } from "react";
import {
  CheckSquare, Calendar, AlertCircle, Clock, Zap, Target,
  ArrowRight, Users, Flame, Plus, Check, Star, TrendingUp,
  Sparkles, MessageSquarePlus, Send, Loader2, Play
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

type Summary = {
  total: number; active: number; completed: number; overdue: number;
  byPriority: Record<string, number>; byBucket: Record<string, number>;
};
type EventData = { events: any[]; totalMeetingMinutes: number; totalFreeMinutes: number; freeSlots: any[] };
type Task = { id: number; title: string; priority: string; dueDate: string | null; status: string };
type AssignedTask = { id: number; title: string; priority: string; assignedByUsername: string; status: string; dueDate: string | null };
type Habit = { id: number; name: string; color: string; frequency: string };
type HabitLog = { id: number; habitId: number; date: string; completed: boolean };

const PRIORITY_LEFT_BORDER: Record<string, string> = {
  urgent: "border-l-red-500",
  high: "border-l-orange-500",
  medium: "border-l-blue-500",
  low: "border-l-zinc-500",
};

const COLORS: Record<string, string> = {
  emerald: "bg-emerald-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  rose: "bg-rose-500",
};

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/[0.04] border border-white/[0.03] ${className}`} />;
}

function ProgressRing({ radius, stroke, progress }: { radius: number; stroke: number; progress: number }) {
  const r = radius - stroke * 2;
  const circ = r * 2 * Math.PI;
  const offset = circ - (progress / 100) * circ;
  return (
    <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
      <circle stroke="rgba(255,255,255,0.06)" fill="transparent" strokeWidth={stroke} r={r} cx={radius} cy={radius} />
      <circle
        stroke="url(#ringGrad)" fill="transparent" strokeWidth={stroke}
        strokeDasharray={`${circ} ${circ}`} style={{ strokeDashoffset: offset, transition: "stroke-dashoffset 1.2s ease-in-out" }}
        strokeLinecap="round" r={r} cx={radius} cy={radius}
      />
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(265,90%,70%)" />
          <stop offset="100%" stopColor="hsl(220,90%,60%)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [todayEvents, setTodayEvents] = useState<EventData | null>(null);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<AssignedTask[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [timeState, setTimeState] = useState({ greeting: "", dateStr: "", name: "" });

  const fetchData = useCallback(async () => {
    try {
      const [s, e, t, a, h] = await Promise.all([
        fetch("/api/tasks/summary").then(r => r.ok ? r.json() : null),
        fetch("/api/events/today").then(r => r.ok ? r.json() : null),
        fetch("/api/tasks/today").then(r => r.ok ? r.json() : null),
        fetch("/api/tasks/assigned").then(r => r.ok ? r.json() : []),
        fetch("/api/habits").then(r => r.ok ? r.json() : []),
      ]);
      if (s && !s.error) setSummary(s);
      if (e && !e.error) setTodayEvents(e);
      if (Array.isArray(t)) setTodayTasks(t.filter((task: Task) => task.status === "active"));
      if (Array.isArray(a)) setAssignedTasks(a.filter((task: AssignedTask) => task.status === "active"));
      if (Array.isArray(h)) {
        setHabits(h);
        if (h.length > 0) {
          const logs = await Promise.all(h.map(habit => fetch(`/api/habits/${habit.id}/log`).then(r => r.ok ? r.json() : [])));
          setHabitLogs(logs.flat());
        }
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const d = new Date();
    const h = d.getHours();
    const greeting = h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
    const dateStr = d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    setTimeState({ greeting, dateStr, name: "" });
    fetchData();
    const id = setInterval(fetchData, 30000);
    return () => clearInterval(id);
  }, [fetchData]);

  const handleCompleteTask = useCallback(async (task: Task) => {
    setCompletingId(task.id);
    // Optimistic update
    setTodayTasks(prev => prev.filter(t => t.id !== task.id));
    setSummary(prev => prev ? {
      ...prev,
      active: Math.max(0, prev.active - 1),
      completed: prev.completed + 1,
    } : prev);
    try {
      await fetch(`/api/tasks/${task.id}/complete`, { method: "PATCH" });
      toast.success("Task completed! 🎉");
    } catch {
      toast.error("Failed to complete task");
      fetchData(); // revert
    } finally {
      setCompletingId(null);
    }
  }, [fetchData]);

  async function toggleHabit(habitId: number) {
    const today = new Date().toISOString().split("T")[0];
    const existing = habitLogs.find(l => l.habitId === habitId && l.date === today);
    
    // Optimistic
    if (existing) {
      setHabitLogs(prev => prev.map(l => l.id === existing.id ? { ...l, completed: !l.completed } : l));
    } else {
      setHabitLogs(prev => [...prev, { id: Date.now(), habitId, date: today, completed: true }]);
    }
    
    try {
      await fetch(`/api/habits/${habitId}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today }),
      });
    } catch {
      toast.error("Failed to update habit");
      fetchData(); // revert
    }
  }

  const completedCount = summary?.completed ?? 0;
  const totalTasks = summary?.total ?? 0;
  const completionRate = totalTasks > 0 ? Math.min(100, Math.round((completedCount / totalTasks) * 100)) : 0;
  const meetingMins = todayEvents?.totalMeetingMinutes ?? 0;

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="relative min-h-full pb-8 page-enter">
      {/* Ambient */}
      <div className="fixed top-0 left-[260px] w-[500px] h-[500px] rounded-full bg-primary/8 blur-[160px] pointer-events-none -z-0" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-blue-600/6 blur-[160px] pointer-events-none -z-0" />

      <div className="relative z-10 max-w-7xl mx-auto">

        {/* Hero Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              {timeState.greeting || "Welcome back"} 👋
            </h1>
            <p className="text-white/50 mt-1 text-sm">{timeState.dateStr || "Loading..."}</p>
          </div>
          
          <div className="flex gap-2">
            <Link href="/chiefofstaff/focus" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold shadow-lg shadow-white/5 hover:bg-white/10 transition-all">
              <Play className="h-4 w-4" /> Focus Mode
            </Link>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

          {/* ── Productivity Ring ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="sm:col-span-1 row-span-1 flex flex-col items-center justify-center rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-6 shadow-xl gap-3"
          >
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40">Completion</p>
            <div className="relative flex items-center justify-center">
              {loading ? (
                <div className="h-28 w-28 rounded-full border-8 border-white/5 border-t-primary/50 animate-spin" />
              ) : (
                <>
                  <ProgressRing radius={64} stroke={8} progress={completionRate} />
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-black text-white">{completionRate}%</span>
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-5 text-center">
              <div>
                <p className="text-xl font-bold text-white">{loading ? "–" : completedCount}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-wide">Done</p>
              </div>
              <div className="w-px bg-white/8" />
              <div>
                <p className="text-xl font-bold text-white">{loading ? "–" : (summary?.active ?? 0)}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-wide">Active</p>
              </div>
            </div>
          </motion.div>

          {/* ── Today's Focus (Tasks) ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
            className="sm:col-span-1 lg:col-span-2 row-span-2 rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-5 shadow-xl flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-primary/15 flex items-center justify-center">
                  <CheckSquare className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Today's Focus</h2>
                  <p className="text-[10px] text-white/40">{loading ? "..." : `${todayTasks.length} tasks remaining`}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(summary?.overdue ?? 0) > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded-full border border-red-500/20">
                    <AlertCircle className="h-3 w-3" /> {summary?.overdue} overdue
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
              {loading ? (
                Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12" />)
              ) : todayTasks.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-3">
                    <Check className="h-7 w-7 text-emerald-400" />
                  </div>
                  <p className="text-sm font-semibold text-white/60">All caught up!</p>
                  <p className="text-xs text-white/30 mt-1">No tasks due today</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {todayTasks.slice(0, 6).map((task, i) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8, height: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`group flex items-center gap-3 p-3 rounded-2xl border-l-2 bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.07] hover:border-white/10 transition-all cursor-default ${PRIORITY_LEFT_BORDER[task.priority] ?? "border-l-zinc-500"}`}
                    >
                      <button
                        onClick={() => handleCompleteTask(task)}
                        disabled={completingId === task.id}
                        className="h-5 w-5 shrink-0 rounded-full border-2 border-white/20 hover:border-primary flex items-center justify-center transition-all hover:bg-primary/10 active:scale-90"
                      >
                        {completingId === task.id && (
                          <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                        )}
                      </button>
                      <p className="flex-1 text-sm font-medium text-white truncate">{task.title}</p>
                      {task.dueDate && (() => {
                        const due = new Date(task.dueDate);
                        const isOverdue = due < new Date();
                        return (
                          <span className={`text-[10px] font-medium shrink-0 ${isOverdue ? "text-red-400" : "text-white/30"}`}>
                            {isOverdue ? "⚠ " : ""}{due.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          </span>
                        );
                      })()}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
              <Link
                href="/chiefofstaff/tasks"
                className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/60 text-xs font-bold text-center hover:bg-white/10 hover:text-white transition-colors"
              >
                View All Tasks →
              </Link>
            </div>
          </motion.div>

          {/* ── Habits (Inline) ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.14 }}
            className="sm:col-span-1 row-span-2 rounded-3xl border border-orange-500/15 bg-orange-500/[0.04] backdrop-blur-xl p-5 shadow-xl flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Flame className="h-4 w-4 text-orange-400" />
                </div>
                <h2 className="text-sm font-bold text-white">Daily Habits</h2>
              </div>
              <Link href="/chiefofstaff/habits" className="text-[10px] text-white/40 hover:text-white">
                Manage
              </Link>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2">
              {loading ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-10" />)
              ) : habits.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center opacity-50 py-4">
                  <span className="text-2xl mb-2">🌱</span>
                  <p className="text-xs text-white/70">No habits set</p>
                </div>
              ) : (
                habits.map(habit => {
                  const isCompleted = habitLogs.some(l => l.habitId === habit.id && l.date === todayStr && l.completed);
                  const colorClass = COLORS[habit.color] || "bg-primary";
                  return (
                    <button
                      key={habit.id}
                      onClick={() => toggleHabit(habit.id)}
                      className="group flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-all text-left"
                    >
                      <div className={`h-6 w-6 rounded-lg flex flex-shrink-0 items-center justify-center transition-all ${isCompleted ? `${colorClass} shadow-lg` : 'bg-white/10'}`}>
                        {isCompleted && <Check className="h-3.5 w-3.5 text-white" />}
                      </div>
                      <span className={`text-sm font-medium truncate ${isCompleted ? 'text-white/50 line-through' : 'text-white/90'}`}>
                        {habit.name}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* ── Meetings ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.16 }}
            className="sm:col-span-1 rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-5 shadow-xl flex flex-col justify-between"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-400" />
              </div>
              <p className="text-xs font-bold text-white/50 uppercase tracking-widest">Meetings</p>
            </div>
            <div>
              <p className="text-3xl font-black text-white">
                {loading ? (
                  <span className="h-8 w-20 rounded-xl bg-white/5 animate-pulse inline-block" />
                ) : (
                  `${Math.floor(meetingMins / 60)}h ${meetingMins % 60}m`
                )}
              </p>
              <p className="text-xs text-white/30 mt-1">in {loading ? "–" : (todayEvents?.events.length ?? 0)} events today</p>
            </div>
          </motion.div>

          {/* ── Today's Timeline ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className="sm:col-span-2 lg:col-span-3 xl:col-span-2 rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-5 shadow-xl flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-blue-500/15 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-blue-400" />
                </div>
                <h2 className="text-sm font-bold text-white">Today's Schedule</h2>
              </div>
              <Link href="/chiefofstaff/calendar" className="text-xs font-bold text-blue-400/70 hover:text-blue-400 transition-colors">
                View full →
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 max-h-[180px]">
              {loading ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-14" />)
              ) : !todayEvents?.events.length ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <span className="text-3xl mb-2">✨</span>
                  <p className="text-sm text-white/40">No events today — free day!</p>
                </div>
              ) : (
                todayEvents.events.map((e: any, i: number) => {
                  const st = new Date(e.startTime);
                  const et = new Date(e.endTime);
                  const now = new Date();
                  const isNow = st <= now && et >= now;
                  const isPast = et < now;
                  return (
                    <div
                      key={e.id}
                      className={`flex items-center gap-3 p-3 rounded-2xl transition-colors ${isNow ? "bg-primary/10 border border-primary/20" : isPast ? "opacity-40" : "hover:bg-white/5"}`}
                    >
                      <div className={`h-2 w-2 rounded-full shrink-0 ${isNow ? "bg-primary animate-pulse" : isPast ? "bg-white/20" : "bg-blue-400/50"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white/50">
                          {st.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} – {et.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <p className={`text-sm font-semibold truncate ${isNow ? "text-primary" : "text-white"}`}>{e.title}</p>
                      </div>
                      {isNow && <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">NOW</span>}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* ── Family Board ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.20 }}
            className="sm:col-span-1 rounded-3xl border border-violet-500/15 bg-violet-500/[0.04] backdrop-blur-xl p-5 shadow-xl hover:-translate-y-0.5 transition-transform duration-300"
          >
            <Link href="/chiefofstaff/shared" className="flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-2xl bg-violet-500/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-violet-400" />
                </div>
                <ArrowRight className="h-4 w-4 text-violet-400/50" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Family Board</h2>
                <p className="text-xs text-white/50 mt-1">Shared household tasks & assignments</p>
              </div>
            </Link>
          </motion.div>

          {/* ── Weekly Review ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.22 }}
            className="sm:col-span-1 rounded-3xl border border-emerald-500/15 bg-emerald-500/[0.04] backdrop-blur-xl p-5 shadow-xl hover:-translate-y-0.5 transition-transform duration-300"
          >
            <Link href="/chiefofstaff/review" className="h-full flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                </div>
                <ArrowRight className="h-4 w-4 text-emerald-400/50" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Weekly Review</h2>
                <p className="text-xs text-white/50 mt-1">AI-powered retrospective & analytics</p>
              </div>
            </Link>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
