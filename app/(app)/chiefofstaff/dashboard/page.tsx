"use client";
import { useEffect, useState, useCallback } from "react";
import {
  CheckSquare, Calendar, AlertCircle, Clock, Zap, Target,
  ArrowRight, Users, Flame, Plus, Check, Star, TrendingUp,
  Sparkles, MessageSquarePlus, Send, Loader2, Play, Crown
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

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "border-error text-error bg-error/10",
  high: "border-orange-500 text-orange-500 bg-orange-500/10",
  medium: "border-blue-500 text-blue-500 bg-blue-500/10",
  low: "border-outline-variant text-on-surface-variant bg-surface-container",
};

const COLORS: Record<string, string> = {
  emerald: "bg-emerald-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  rose: "bg-rose-500",
};

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-surface-container border border-outline-variant/30 ${className}`} />;
}

export default function ChiefOfStaffDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [todayEvents, setTodayEvents] = useState<EventData | null>(null);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<AssignedTask[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<number | null>(null);
  
  const [settings, setSettings] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const [s, e, t, a, hData, set] = await Promise.all([
        fetch("/api/tasks/summary").then(r => r.ok ? r.json() : null),
        fetch("/api/events/today").then(r => r.ok ? r.json() : null),
        fetch("/api/tasks/today").then(r => r.ok ? r.json() : null),
        fetch("/api/tasks/assigned").then(r => r.ok ? r.json() : []),
        fetch("/api/habits").then(r => r.ok ? r.json() : null),
        fetch("/api/settings").then(r => r.ok ? r.json() : null),
      ]);
      if (s && !s.error) setSummary(s);
      if (e && !e.error) setTodayEvents(e);
      if (Array.isArray(t)) setTodayTasks(t.filter((task: Task) => task.status === "active"));
      if (Array.isArray(a)) setAssignedTasks(a.filter((task: AssignedTask) => task.status === "active"));
      if (set && !set.error) setSettings(set);
      if (hData && Array.isArray(hData.habits)) {
        setHabits(hData.habits);
        setHabitLogs(Array.isArray(hData.logs) ? hData.logs : []);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30000);
    return () => clearInterval(id);
  }, [fetchData]);

  const handleCompleteTask = useCallback(async (task: Task) => {
    setCompletingId(task.id);
    setTodayTasks(prev => prev.filter(t => t.id !== task.id));
    setSummary(prev => prev ? {
      ...prev,
      active: Math.max(0, prev.active - 1),
      completed: prev.completed + 1,
    } : prev);
    try {
      await fetch(`/api/tasks/${task.id}/complete`, { method: "PATCH" });
      toast.success("Task completed!");
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
      fetchData();
    }
  }

  const completedCount = summary?.completed ?? 0;
  const totalTasks = summary?.total ?? 0;
  const completionRate = totalTasks > 0 ? Math.min(100, Math.round((completedCount / totalTasks) * 100)) : 0;
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12 w-full max-w-[1440px] mx-auto page-enter">
      {/* Hero & Today Score (Spans 8) */}
      <div className="lg:col-span-8 bg-white dark:bg-surface-container border-[3px] border-black dark:border-transparent shadow-[0_4px_0_0_#000] dark:shadow-none rounded-[32px] p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col gap-2 relative z-10 w-full md:w-auto">
          <span className="font-mono-label text-sm text-primary/70 uppercase tracking-widest mb-2">{todayStr}</span>
          <h2 className="font-display-lg text-4xl md:text-5xl font-bold text-primary text-balance leading-tight">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}
          </h2>
          <p className="font-body-lg text-lg text-on-surface-variant mt-2">Here is what's on your agenda today. You have {todayTasks.length} pending tasks.</p>
        </div>
        
        {/* Progress Ring Graphic */}
        <div className="relative w-48 h-48 flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-surface rounded-full border-[2px] border-black dark:border-transparent shadow-[inset_0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-none">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path className="text-surface-container-high stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3"></path>
            <path className="text-primary stroke-current progress-ring-circle transition-all duration-1000" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray={`${completionRate}, 100`} strokeLinecap="round" strokeWidth="3"></path>
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="font-display-lg text-4xl font-bold text-primary leading-none">{completionRate}<span className="text-2xl">%</span></span>
            <span className="font-mono-label text-xs text-on-surface-variant mt-1 uppercase">Today</span>
          </div>
        </div>
      </div>

      {/* Habits & Quick Actions (Spans 4) */}
      <div className="lg:col-span-4 bg-white dark:bg-secondary-fixed/30 border-[3px] border-black dark:border-secondary-fixed rounded-[32px] p-8 flex flex-col justify-between shadow-[0_4px_0_0_#000] dark:shadow-none relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-20">
          <span className="material-symbols-outlined text-6xl text-secondary">local_fire_department</span>
        </div>
        <div>
          <div className="inline-flex items-center gap-2 bg-gray-100 dark:bg-surface-container-lowest border-[2px] border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-none px-3 py-1 rounded-full mb-6">
            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
            <span className="font-mono-label text-xs text-secondary uppercase font-bold tracking-widest">Daily Habits</span>
          </div>
          
          <div className="flex flex-wrap gap-2 relative z-10">
            {loading ? (
              Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-8 w-24 rounded-full" />)
            ) : habits.length === 0 ? (
              <p className="font-body-md text-on-surface-variant">No habits set up yet.</p>
            ) : (
              habits.map(habit => {
                const isCompleted = habitLogs.some(l => l.habitId === habit.id && l.date === todayStr && l.completed);
                return (
                  <div 
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id)}
                    className={`rounded-full px-4 py-2 font-mono-label text-xs font-bold uppercase flex items-center gap-2 cursor-pointer transition-all border-[2px] ${isCompleted ? 'border-black dark:border-primary bg-[#06D6A0] dark:bg-primary text-black dark:text-on-primary shadow-[0_2px_0_0_#000] dark:shadow-none translate-y-[2px]' : 'border-black dark:border-outline-variant bg-white dark:bg-surface hover:bg-gray-50 text-black dark:text-on-surface-variant shadow-[0_3px_0_0_#000] dark:shadow-none hover:translate-y-[2px] hover:shadow-[0_1px_0_0_#000] dark:hover:shadow-none'}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-on-primary animate-pulse' : 'bg-outline-variant'}`}></div>
                    {habit.name}
                  </div>
                );
              })
            )}
          </div>
        </div>
        <Link href="/chiefofstaff/focus" className="mt-8 w-full py-4 bg-[#EF476F] dark:bg-secondary text-white dark:text-on-secondary rounded-xl font-mono-label text-xs font-bold tracking-widest uppercase hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 border-[2px] border-black dark:border-transparent shadow-[0_4px_0_0_#000] dark:shadow-none hover:shadow-[0_2px_0_0_#000] dark:hover:shadow-none relative z-10">
          <span className="material-symbols-outlined">play_arrow</span>
          Start Focus
        </Link>
      </div>

      {/* Middle Section - Tasks */}
      <div className="lg:col-span-6 bg-white dark:bg-surface-container-low border-[3px] border-black dark:border-transparent shadow-[0_4px_0_0_#000] dark:shadow-none rounded-[32px] p-8 flex flex-col h-[500px]">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-headline-md text-2xl font-bold text-primary">Today's Priorities</h3>
          <Link href="/chiefofstaff/tasks" className="w-10 h-10 rounded-full hover:bg-surface-container flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">arrow_forward</span>
          </Link>
        </div>
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">
          {loading ? (
             Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
          ) : todayTasks.length === 0 ? (
             <div className="text-on-surface-variant text-center py-8">No tasks today!</div>
          ) : (
            <AnimatePresence>
              {todayTasks.slice(0, 6).map((task) => (
                <motion.div 
                  key={task.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-surface hover:bg-gray-50 dark:hover:bg-surface-container-highest transition-all cursor-pointer border-[2px] border-black dark:border-outline-variant/10 shadow-[0_3px_0_0_#000] dark:shadow-none hover:translate-y-[2px] hover:shadow-[0_1px_0_0_#000] dark:hover:shadow-none"
                  onClick={() => handleCompleteTask(task)}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.priority === 'urgent' || task.priority === 'high' ? 'border-error' : 'border-outline-variant group-hover:border-primary'}`}>
                     {completingId === task.id && <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />}
                  </div>
                  <span className="font-body-lg text-on-surface font-medium flex-1 truncate">{task.title}</span>
                  {task.dueDate && (
                    <span className="font-mono-label text-xs font-bold text-outline uppercase">
                      {new Date(task.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Calendar / Timeline */}
      <div className="lg:col-span-6 bg-white dark:bg-surface-container-low border-[3px] border-black dark:border-transparent shadow-[0_4px_0_0_#000] dark:shadow-none rounded-[32px] p-8 flex flex-col h-[500px] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <span className="material-symbols-outlined text-8xl text-primary">calendar_month</span>
        </div>
        <div className="flex items-center justify-between mb-8 relative z-10">
          <h3 className="font-headline-md text-2xl font-bold text-primary">Coming Up</h3>
          <Link href="/chiefofstaff/calendar" className="w-10 h-10 rounded-full hover:bg-surface-container flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">arrow_forward</span>
          </Link>
        </div>
        <div className="flex-1 flex flex-col gap-6 relative z-10 overflow-y-auto custom-scrollbar pr-2">
          {loading ? (
             Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
          ) : !todayEvents?.events?.length ? (
            <div className="text-on-surface-variant text-center py-8">No events coming up today.</div>
          ) : (
            todayEvents.events.map((event) => {
              const st = new Date(event.startTime);
              const et = new Date(event.endTime);
              const now = new Date();
              const isNow = st <= now && et >= now;
              const isPast = et < now;

              return (
                <div key={event.id} className={`flex gap-6 relative ${isPast ? 'opacity-50' : ''}`}>
                  <div className="flex flex-col items-center">
                    <span className={`font-mono-label text-xs font-bold w-16 text-right shrink-0 uppercase ${isNow ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {st.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </span>
                    <div className="w-px h-full bg-outline-variant/30 mt-2"></div>
                  </div>
                  <div className={`flex-1 p-5 rounded-2xl flex items-center justify-between border-[2px] ${isNow ? 'bg-[#FFD166] dark:bg-primary-container text-black dark:text-on-primary-container border-black dark:border-primary/20 shadow-[0_3px_0_0_#000] dark:shadow-none' : 'bg-white dark:bg-surface border-black dark:border-outline-variant/10 shadow-[0_2px_0_0_#000] dark:shadow-none'}`}>
                    <h4 className={`font-body-lg font-medium truncate ${isNow ? 'text-on-primary-container' : 'text-on-surface'}`}>{event.title}</h4>
                    {isNow && <span className="font-mono-label text-xs font-bold uppercase tracking-widest text-primary animate-pulse ml-4">Now</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-8 mt-4">
        <div className="bg-white dark:bg-surface-container border-[3px] border-black dark:border-transparent shadow-[0_4px_0_0_#000] dark:shadow-none rounded-[32px] p-6 md:p-8 flex items-center gap-6 hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#000] dark:hover:shadow-none transition-all">
          <div className="w-16 h-16 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">task_alt</span>
          </div>
          <div>
            <p className="font-mono-label text-xs font-bold text-outline uppercase tracking-wider mb-1">Tasks Completed</p>
            <p className="font-display-lg text-4xl font-bold text-primary leading-none">{summary?.completed || 0}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-surface-container border-[3px] border-black dark:border-transparent shadow-[0_4px_0_0_#000] dark:shadow-none rounded-[32px] p-6 md:p-8 flex items-center gap-6 hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#000] dark:hover:shadow-none transition-all">
          <div className="w-16 h-16 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">local_fire_department</span>
          </div>
          <div>
            <p className="font-mono-label text-xs font-bold text-outline uppercase tracking-wider mb-1">Habits Logged</p>
            <p className="font-display-lg text-4xl font-bold text-primary leading-none">{habitLogs.filter(l => l.date === todayStr && l.completed).length}</p>
          </div>
        </div>
        
        <div className="bg-[#3E85E4] dark:bg-secondary-container/50 border-[3px] border-black dark:border-secondary-container shadow-[0_4px_0_0_#000] dark:shadow-none rounded-[32px] p-6 md:p-8 flex items-center gap-6 hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#000] dark:hover:shadow-none transition-all">
          <div className="w-16 h-16 rounded-full bg-white dark:bg-secondary text-black dark:text-on-secondary flex items-center justify-center border-[2px] border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-none">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
          </div>
          <div>
            <p className="font-mono-label text-xs font-bold text-white dark:text-secondary uppercase tracking-wider mb-1">Total Experience</p>
            <p className="font-display-lg text-4xl font-bold text-white dark:text-secondary leading-none">{settings?.xp || 0} <span className="text-xl">XP</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
