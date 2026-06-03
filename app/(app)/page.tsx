"use client";
import { useEffect, useState } from "react";
import { LayoutDashboard, CheckSquare, Calendar, AlertCircle, Clock, Zap, TrendingUp } from "lucide-react";

type Summary = { total: number; active: number; completed: number; overdue: number; byPriority: Record<string, number>; byBucket: Record<string, number> };
type EventData = { events: any[]; totalMeetingMinutes: number; totalFreeMinutes: number; freeSlots: any[] };
type Task = { id: number; title: string; priority: string; dueDate: string | null; status: string };

const PRIORITY_COLORS: Record<string, string> = { urgent: "bg-red-500/20 text-red-400 border-red-500/30", high: "bg-orange-500/20 text-orange-400 border-orange-500/30", medium: "bg-blue-500/20 text-blue-400 border-blue-500/30", low: "bg-gray-500/20 text-gray-400 border-gray-500/30" };

function StatCard({ icon: Icon, label, value, sub, highlight }: { icon: any; label: string; value: number | string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 ${highlight ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${highlight ? "bg-destructive/10" : "bg-primary/10"}`}>
          <Icon className={`h-4 w-4 ${highlight ? "text-destructive" : "text-primary"}`} />
        </div>
      </div>
      <div className={`text-3xl font-bold ${highlight ? "text-destructive" : "text-foreground"}`}>{value}</div>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [todayEvents, setTodayEvents] = useState<EventData | null>(null);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  useEffect(() => {
    Promise.all([
      fetch("/api/tasks/summary").then(r => r.json()),
      fetch("/api/events/today").then(r => r.json()),
      fetch("/api/tasks/today").then(r => r.json()),
    ]).then(([s, e, t]) => { setSummary(s); setTodayEvents(e); setTodayTasks(t); setLoading(false); });
  }, []);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{greeting} 👋</h1>
              <p className="text-sm text-muted-foreground">{dateStr}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28" />) : <>
          <StatCard icon={CheckSquare} label="Tasks Today" value={summary?.byBucket.today ?? 0} sub={`${summary?.active ?? 0} active total`} />
          <StatCard icon={Calendar} label="Events Today" value={todayEvents?.events.length ?? 0} sub={`${todayEvents?.totalMeetingMinutes ? Math.round(todayEvents.totalMeetingMinutes / 60) : 0}h in meetings`} />
          <StatCard icon={TrendingUp} label="Completed" value={summary?.completed ?? 0} sub="all time" />
          <StatCard icon={AlertCircle} label="Overdue" value={summary?.overdue ?? 0} sub="need attention" highlight={(summary?.overdue ?? 0) > 0} />
        </>}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Schedule */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Today's Schedule</h2>
          </div>
          {loading ? <div className="space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            : todayEvents?.events.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-8">No events today. A clear day! 🎉</p>
              : <div className="space-y-2">
                  {todayEvents?.events.slice(0, 6).map((e: any) => (
                    <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="w-1 h-8 rounded-full bg-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{e.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(e.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} – {new Date(e.endTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
          }
        </div>

        {/* Priority Tasks */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckSquare className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Priority Tasks</h2>
          </div>
          {loading ? <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            : todayTasks.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-8">No tasks for today. Great work! ✨</p>
              : <div className="space-y-2">
                  {todayTasks.slice(0, 6).map((task) => (
                    <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        {task.dueDate && <p className="text-xs text-muted-foreground mt-0.5">Due {new Date(task.dueDate).toLocaleDateString()}</p>}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium}`}>{task.priority}</span>
                    </div>
                  ))}
                </div>
          }
        </div>
      </div>

      {/* Free time banner */}
      {!loading && (todayEvents?.freeSlots?.length ?? 0) > 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-3">
          <Zap className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="text-sm font-medium text-primary">
              {todayEvents!.freeSlots.length} free slot{todayEvents!.freeSlots.length > 1 ? "s" : ""} available today ({todayEvents!.freeSlots.reduce((s: number, f: any) => s + f.durationMinutes, 0)} min total)
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Next: {new Date(todayEvents!.freeSlots[0].start).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} – {new Date(todayEvents!.freeSlots[0].end).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
        </div>
      )}
    </div>
  );
}
