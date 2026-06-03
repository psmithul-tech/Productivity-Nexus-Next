"use client";
import { useEffect, useState } from "react";
import { CheckSquare, Calendar, AlertCircle, Clock, Zap, Target, ArrowRight } from "lucide-react";
import Link from "next/link";

type Summary = { total: number; active: number; completed: number; overdue: number; byPriority: Record<string, number>; byBucket: Record<string, number> };
type EventData = { events: any[]; totalMeetingMinutes: number; totalFreeMinutes: number; freeSlots: any[] };
type Task = { id: number; title: string; priority: string; dueDate: string | null; status: string };

const PRIORITY_COLORS: Record<string, string> = { 
  urgent: "bg-red-500/20 text-red-500 border-red-500/30", 
  high: "bg-orange-500/20 text-orange-500 border-orange-500/30", 
  medium: "bg-blue-500/20 text-blue-500 border-blue-500/30", 
  low: "bg-gray-500/20 text-gray-500 border-gray-500/30" 
};

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-3xl bg-white/5 border border-white/5 ${className}`} />;
}

// SVG Progress Ring Component
function ProgressRing({ radius, stroke, progress, colorClass }: { radius: number; stroke: number; progress: number; colorClass: string }) {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg height={radius * 2} width={radius * 2} className="transform -rotate-90 drop-shadow-xl">
      <circle stroke="rgba(255,255,255,0.05)" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
      <circle stroke="currentColor" fill="transparent" strokeWidth={stroke} strokeDasharray={circumference + ' ' + circumference} style={{ strokeDashoffset, transition: "stroke-dashoffset 1s ease-in-out" }} strokeLinecap="round" r={normalizedRadius} cx={radius} cy={radius} className={colorClass} />
    </svg>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [todayEvents, setTodayEvents] = useState<EventData | null>(null);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeState, setTimeState] = useState({ greeting: "", dateStr: "" });

  useEffect(() => {
    const d = new Date();
    setTimeState({
      greeting: d.getHours() < 12 ? "Good Morning" : d.getHours() < 17 ? "Good Afternoon" : "Good Evening",
      dateStr: d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    });

    const fetchData = () => {
      Promise.all([
        fetch("/api/tasks/summary").then(r => r.json()),
        fetch("/api/events/today").then(r => r.json()),
        fetch("/api/tasks/today").then(r => r.json()),
      ]).then(([s, e, t]) => { setSummary(s); setTodayEvents(e); setTodayTasks(t); setLoading(false); });
    };

    fetchData();
    const intervalId = setInterval(fetchData, 15000);
    return () => clearInterval(intervalId);
  }, []);

  const totalToday = (summary?.byBucket.today ?? 0) + (summary?.completed ?? 0); // Approx total tasks today
  const completionRate = totalToday > 0 ? Math.round(((summary?.completed ?? 0) / totalToday) * 100) : 0;

  return (
    <div className="relative min-h-screen pb-12 w-full overflow-hidden font-sans">
      {/* ── Ambient Glows ── */}
      <div className="fixed top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-primary/10 blur-[150px] opacity-70 mix-blend-screen pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] h-[700px] w-[700px] rounded-full bg-blue-600/10 blur-[150px] opacity-60 mix-blend-screen pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-8">
        
        {/* ── Bento Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 auto-rows-[minmax(140px,auto)] gap-4 sm:gap-6">
          
          {/* Welcome Card (Hero) */}
          <div className="md:col-span-4 lg:col-span-4 row-span-1 flex flex-col justify-center rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-8 sm:p-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all duration-700 pointer-events-none">
              <Zap className="h-48 w-48 text-primary/50" />
            </div>
            <div className="relative z-10">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-2">
                {timeState.greeting}
              </h1>
              <p className="text-lg font-medium text-white/60 tracking-wide">{timeState.dateStr || "Loading..."}</p>
            </div>
          </div>

          {/* Productivity Score / Ring */}
          <div className="md:col-span-2 lg:col-span-2 row-span-2 flex flex-col items-center justify-center rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-2xl p-8 shadow-2xl relative overflow-hidden group hover:border-primary/30 transition-colors duration-500">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <h2 className="text-sm font-bold tracking-widest uppercase text-white/50 mb-6 w-full text-center relative z-10">Productivity Score</h2>
            <div className="relative flex items-center justify-center mb-4 z-10">
              {loading ? (
                <div className="h-40 w-40 rounded-full border-8 border-white/10 border-t-primary animate-spin" />
              ) : (
                <>
                  <ProgressRing radius={90} stroke={12} progress={completionRate} colorClass="text-primary" />
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-5xl font-extrabold text-white">{completionRate}%</span>
                    <span className="text-xs font-semibold text-white/50 uppercase tracking-widest mt-1">Completed</span>
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-4 w-full justify-center text-center mt-2 relative z-10">
              <div>
                <p className="text-2xl font-bold text-white">{summary?.completed ?? 0}</p>
                <p className="text-xs text-white/50">Done</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="text-2xl font-bold text-white">{summary?.byBucket.today ?? 0}</p>
                <p className="text-xs text-white/50">To Do</p>
              </div>
            </div>
          </div>

          {/* Quick Actions (Assistant) */}
          <div className="md:col-span-2 lg:col-span-2 row-span-1 rounded-[2.5rem] border border-primary/20 bg-primary/10 backdrop-blur-2xl p-6 shadow-2xl shadow-primary/5 hover:-translate-y-1 transition-transform duration-300">
            <Link href="/assistant" className="h-full flex flex-col justify-center">
              <div className="flex items-center justify-between mb-3">
                <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-white" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-white">AI Chief of Staff</h2>
              <p className="text-sm text-white/70 mt-1">Chat to prioritize your day or batch add tasks.</p>
            </Link>
          </div>

          {/* Quick Stats: Meetings */}
          <div className="md:col-span-2 lg:col-span-2 row-span-1 rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-6 shadow-2xl flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-blue-400" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/50">Time in Meetings</h3>
            </div>
            <p className="text-3xl font-extrabold text-white">
              {loading ? "-" : `${Math.round((todayEvents?.totalMeetingMinutes ?? 0) / 60)}h ${(todayEvents?.totalMeetingMinutes ?? 0) % 60}m`}
            </p>
          </div>

          {/* Timeline */}
          <div className="md:col-span-4 lg:col-span-4 row-span-2 rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-8 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-white tracking-tight">Today's Timeline</h2>
              </div>
              <Link href="/calendar" className="text-sm font-bold text-primary/80 hover:text-primary transition-colors">View full →</Link>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {loading ? (
                <div className="space-y-4">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}</div>
              ) : todayEvents?.events.length === 0 ? (
                <div className="h-full flex items-center justify-center flex-col text-center opacity-50">
                  <span className="text-4xl mb-3">✨</span>
                  <p className="text-white font-medium">Your schedule is entirely clear today!</p>
                </div>
              ) : (
                <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-white/20 before:to-transparent">
                  {todayEvents?.events.map((e: any, i: number) => {
                    const st = new Date(e.startTime);
                    const et = new Date(e.endTime);
                    const now = new Date();
                    const isNext = st > now && (i === 0 || new Date(todayEvents.events[i-1].startTime) < now);
                    
                    return (
                      <div key={e.id} className={`relative flex items-center gap-6 p-4 rounded-3xl transition-colors ${isNext ? "bg-white/10 border border-white/20" : "hover:bg-white/5"}`}>
                        <div className={`flex items-center justify-center w-4 h-4 rounded-full border-[3px] border-background z-10 shrink-0 ${isNext ? "bg-primary w-5 h-5 ml-[-2px] shadow-[0_0_15px_rgba(var(--primary),0.8)]" : "bg-white/40"}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold mb-0.5 ${isNext ? "text-primary" : "text-white/60"}`}>
                            {st.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} - {et.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          <h3 className="text-lg font-bold text-white truncate leading-tight">{e.title}</h3>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Action Items (Tasks) */}
          <div className="md:col-span-2 lg:col-span-2 row-span-2 rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-8 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <CheckSquare className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-white tracking-tight">Focus</h2>
              </div>
              {(summary?.overdue ?? 0) > 0 && (
                <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded-full"><AlertCircle className="h-3 w-3" /> {summary?.overdue} Overdue</span>
              )}
            </div>

            <div className="flex-1 flex flex-col gap-3">
              {loading ? (
                <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-2xl" />)}</div>
              ) : todayTasks.length === 0 ? (
                <div className="h-full flex items-center justify-center flex-col text-center opacity-50">
                  <span className="text-4xl mb-3">🎯</span>
                  <p className="text-white font-medium">All tasks complete!</p>
                </div>
              ) : (
                todayTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="group relative flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] hover:border-white/10 transition-all duration-300">
                    <div className={`shrink-0 w-1.5 h-full absolute left-0 top-0 bottom-0 opacity-50 ${PRIORITY_COLORS[task.priority]?.split(' ')[0]}`} />
                    <div className="h-5 w-5 shrink-0 rounded-full border-2 border-white/30 group-hover:border-primary transition-colors ml-1" />
                    <div className="flex-1 min-w-0 pl-1">
                      <p className="text-sm font-bold text-white truncate">{task.title}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link href="/tasks" className="mt-6 w-full py-3 rounded-2xl bg-white/5 text-white/70 text-sm font-bold text-center hover:bg-white/10 hover:text-white transition-colors">
              View All Tasks
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
