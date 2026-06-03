"use client";

import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TaskSummary {
  total: number;
  active: number;
  completed: number;
  overdue: number;
  byPriority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  byBucket: {
    today: number;
    this_week: number;
    upcoming: number;
    waiting: number;
    someday: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pct(count: number, total: number) {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: number;
  sub?: string;
  color: string;
  icon: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-all hover:scale-[1.015] ${color}`}
    >
      <div className="pointer-events-none absolute -bottom-6 -right-6 h-20 w-20 rounded-full opacity-20 blur-2xl"
        style={{ background: "currentColor" }}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-4xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {sub && (
            <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
          )}
        </div>
        <span className="text-2xl opacity-70">{icon}</span>
      </div>
    </div>
  );
}

function PriorityBar({
  label,
  count,
  total,
  barColor,
  textColor,
  bgColor,
}: {
  label: string;
  count: number;
  total: number;
  barColor: string;
  textColor: string;
  bgColor: string;
}) {
  const percent = pct(count, total);
  return (
    <div className="group">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className={`h-2.5 w-2.5 rounded-full ${barColor}`} />
          <span className="text-sm font-medium text-foreground capitalize">{label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${textColor} ${bgColor}`}>
            {count}
          </span>
          <span className="w-8 text-right text-xs text-muted-foreground">{percent}%</span>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function BucketRow({
  label,
  count,
  total,
  emoji,
}: {
  label: string;
  count: number;
  total: number;
  emoji: string;
}) {
  const percent = pct(count, total);
  return (
    <div className="flex items-center gap-4">
      <span className="w-5 text-base">{emoji}</span>
      <span className="w-24 flex-shrink-0 text-sm text-foreground">{label}</span>
      <div className="flex-1 h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-primary/60 transition-all duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="w-8 text-right text-sm font-medium text-foreground">{count}</span>
      <span className="w-8 text-right text-xs text-muted-foreground">{percent}%</span>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-white/5 ${className}`} />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<TaskSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks/summary");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: TaskSummary = await res.json();
      setSummary(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const completionRate = summary
    ? pct(summary.completed, summary.total)
    : 0;

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-8">
      {/* ── Header ── */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Task performance overview
          </p>
        </div>
        {!loading && (
          <button
            onClick={fetchData}
            className="rounded-xl border border-border bg-card/50 px-4 py-2 text-sm text-muted-foreground backdrop-blur hover:text-foreground transition-colors"
          >
            ↻ Refresh
          </button>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-400">
          <span className="text-sm">{error}</span>
          <button
            onClick={fetchData}
            className="ml-4 rounded-lg border border-red-500/30 px-3 py-1 text-xs hover:bg-red-500/20 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card/50 p-5 animate-pulse space-y-3">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-8 w-1/2" />
              </div>
            ))}
          </>
        ) : (
          <>
            <StatCard
              label="Total Tasks"
              value={summary?.total ?? 0}
              sub="All time"
              color="border-border bg-card/50"
              icon="📋"
            />
            <StatCard
              label="Active"
              value={summary?.active ?? 0}
              sub="In progress"
              color="border-blue-500/20 bg-blue-500/5"
              icon="⚡"
            />
            <StatCard
              label="Completed"
              value={summary?.completed ?? 0}
              sub={`${completionRate}% completion rate`}
              color="border-emerald-500/20 bg-emerald-500/5"
              icon="✅"
            />
            <StatCard
              label="Overdue"
              value={summary?.overdue ?? 0}
              sub="Need attention"
              color="border-red-500/20 bg-red-500/5"
              icon="⚠️"
            />
          </>
        )}
      </div>

      {/* ── Completion Ring ── */}
      {!loading && summary && (
        <div className="mb-8 rounded-2xl border border-border bg-card/50 p-6 backdrop-blur-xl">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-8">
            {/* Ring visualization */}
            <div className="relative flex-shrink-0">
              <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="30"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-white/5"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="30"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 30}`}
                  strokeDashoffset={`${2 * Math.PI * 30 * (1 - completionRate / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-foreground">{completionRate}%</span>
              </div>
            </div>

            <div>
              <h2 className="text-base font-semibold text-foreground">Completion Rate</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {summary.completed} of {summary.total} tasks completed
              </p>
              {summary.overdue > 0 && (
                <p className="mt-2 text-xs text-red-400">
                  ⚠️ {summary.overdue} overdue task{summary.overdue !== 1 ? "s" : ""} need your attention
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Two column grid ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Priority Breakdown */}
        <div className="rounded-2xl border border-border bg-card/50 p-6 backdrop-blur-xl">
          <h2 className="mb-5 text-base font-semibold text-foreground">
            By Priority
          </h2>
          {loading ? (
            <div className="space-y-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-1.5 animate-pulse">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          ) : !summary ? null : (
            <div className="space-y-5">
              <PriorityBar
                label="Urgent"
                count={summary.byPriority.urgent}
                total={summary.total}
                barColor="bg-red-500"
                textColor="text-red-400"
                bgColor="border border-red-500/20 bg-red-500/10"
              />
              <PriorityBar
                label="High"
                count={summary.byPriority.high}
                total={summary.total}
                barColor="bg-orange-500"
                textColor="text-orange-400"
                bgColor="border border-orange-500/20 bg-orange-500/10"
              />
              <PriorityBar
                label="Medium"
                count={summary.byPriority.medium}
                total={summary.total}
                barColor="bg-blue-500"
                textColor="text-blue-400"
                bgColor="border border-blue-500/20 bg-blue-500/10"
              />
              <PriorityBar
                label="Low"
                count={summary.byPriority.low}
                total={summary.total}
                barColor="bg-zinc-500"
                textColor="text-zinc-400"
                bgColor="border border-zinc-500/20 bg-zinc-500/10"
              />
            </div>
          )}
        </div>

        {/* Bucket Breakdown */}
        <div className="rounded-2xl border border-border bg-card/50 p-6 backdrop-blur-xl">
          <h2 className="mb-5 text-base font-semibold text-foreground">
            By Bucket
          </h2>
          {loading ? (
            <div className="space-y-5 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-2 flex-1" />
                  <Skeleton className="h-3 w-6" />
                </div>
              ))}
            </div>
          ) : !summary ? null : (
            <div className="space-y-5">
              <BucketRow
                label="Today"
                count={summary.byBucket.today}
                total={summary.total}
                emoji="📅"
              />
              <BucketRow
                label="This Week"
                count={summary.byBucket.this_week}
                total={summary.total}
                emoji="🗓️"
              />
              <BucketRow
                label="Upcoming"
                count={summary.byBucket.upcoming}
                total={summary.total}
                emoji="🔮"
              />
              <BucketRow
                label="Waiting"
                count={summary.byBucket.waiting}
                total={summary.total}
                emoji="⏳"
              />
              <BucketRow
                label="Someday"
                count={summary.byBucket.someday}
                total={summary.total}
                emoji="💭"
              />
            </div>
          )}

          {/* Divider + total */}
          {!loading && summary && (
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-sm font-semibold text-foreground">{summary.total}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
