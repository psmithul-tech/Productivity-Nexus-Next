"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = "urgent" | "high" | "medium" | "low";
type Bucket = "today" | "this_week" | "upcoming" | "waiting" | "someday";
type StatusFilter = "active" | "completed";
type BucketFilter = "all" | "today" | "this_week" | "upcoming";

interface Task {
  id: number | string;
  title: string;
  priority: Priority;
  bucket: Bucket;
  status: "active" | "completed";
  dueDate?: string;
  notes?: string;
}

interface NewTask {
  title: string;
  priority: Priority;
  bucket: Bucket;
  dueDate: string;
  notes: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PRIORITY_STYLES: Record<Priority, string> = {
  urgent: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  low: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

const PRIORITY_DOT: Record<Priority, string> = {
  urgent: "bg-red-400",
  high: "bg-orange-400",
  medium: "bg-blue-400",
  low: "bg-zinc-400",
};

const BUCKET_LABELS: Record<string, string> = {
  today: "Today",
  this_week: "This Week",
  upcoming: "Upcoming",
  waiting: "Waiting",
  someday: "Someday",
};

const BUCKET_FILTER_TABS: { label: string; value: BucketFilter }[] = [
  { label: "All", value: "all" },
  { label: "Today", value: "today" },
  { label: "This Week", value: "this_week" },
  { label: "Upcoming", value: "upcoming" },
];

// ─── Add Task Modal ───────────────────────────────────────────────────────────

function AddTaskModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (task: NewTask) => Promise<void>;
}) {
  const [form, setForm] = useState<NewTask>({
    title: "",
    priority: "medium",
    bucket: "today",
    dueDate: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setForm({ title: "", priority: "medium", bucket: "today", dueDate: "", notes: "" });
      setErr(null);
      setTimeout(() => firstRef.current?.focus(), 50);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setErr("Title is required");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await onSave(form);
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card/90 p-6 backdrop-blur-xl shadow-2xl">
        <h2 className="mb-5 text-lg font-semibold text-foreground">New Task</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Title
            </label>
            <input
              ref={firstRef}
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="What needs to be done?"
              className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          {/* Priority + Bucket row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: e.target.value as Priority })
                }
                className="w-full rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                <option value="urgent">🔴 Urgent</option>
                <option value="high">🟠 High</option>
                <option value="medium">🔵 Medium</option>
                <option value="low">⚪ Low</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Bucket
              </label>
              <select
                value={form.bucket}
                onChange={(e) =>
                  setForm({ ...form, bucket: e.target.value as Bucket })
                }
                className="w-full rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="upcoming">Upcoming</option>
                <option value="waiting">Waiting</option>
                <option value="someday">Someday</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Due Date <span className="opacity-50">(optional)</span>
            </label>
            <input
              type="datetime-local"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Notes <span className="opacity-50">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any additional details…"
              className="w-full resize-none rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          {err && (
            <p className="text-xs text-red-400">{err}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border bg-transparent py-2.5 text-sm text-muted-foreground hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl border border-primary/30 bg-primary/20 py-2.5 text-sm font-medium text-primary hover:bg-primary/30 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : "Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Task Row ─────────────────────────────────────────────────────────────────

function TaskRow({
  task,
  onComplete,
  onDelete,
}: {
  task: Task;
  onComplete: (id: number | string) => void;
  onDelete: (id: number | string) => void;
}) {
  const [completing, setCompleting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <li
      className={`group flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
        task.status === "completed"
          ? "border-border/30 bg-background/10 opacity-60"
          : "border-border/50 bg-background/30 hover:bg-background/50"
      }`}
    >
      {/* Priority dot */}
      <div
        className={`h-2 w-2 flex-shrink-0 rounded-full ${
          task.status === "completed" ? "bg-zinc-600" : PRIORITY_DOT[task.priority]
        }`}
      />

      {/* Title + bucket */}
      <div className="flex-1 min-w-0">
        <p
          className={`truncate text-sm ${
            task.status === "completed"
              ? "text-muted-foreground line-through"
              : "text-foreground"
          }`}
        >
          {task.title}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground/70">
            {BUCKET_LABELS[task.bucket] ?? task.bucket}
          </span>
          {task.dueDate && (
            <span className="text-[10px] text-muted-foreground/50">
              · Due {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Priority badge */}
      <span
        className={`hidden rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider sm:block ${
          PRIORITY_STYLES[task.priority]
        }`}
      >
        {task.priority}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        {task.status === "active" && (
          <button
            onClick={async () => {
              setCompleting(true);
              await onComplete(task.id);
              setCompleting(false);
            }}
            disabled={completing}
            title="Mark complete"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
          >
            {completing ? (
              <span className="block h-3.5 w-3.5 animate-spin rounded-full border border-emerald-400 border-t-transparent" />
            ) : (
              "✓"
            )}
          </button>
        )}
        <button
          onClick={async () => {
            setDeleting(true);
            await onDelete(task.id);
            setDeleting(false);
          }}
          disabled={deleting}
          title="Delete"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          {deleting ? (
            <span className="block h-3.5 w-3.5 animate-spin rounded-full border border-red-400 border-t-transparent" />
          ) : (
            "✕"
          )}
        </button>
      </div>
    </li>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bucketFilter, setBucketFilter] = useState<BucketFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [showModal, setShowModal] = useState(false);

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (bucketFilter !== "all") params.set("bucket", bucketFilter);
    return `/api/tasks?${params.toString()}`;
  }, [bucketFilter, statusFilter]);

  async function fetchTasks() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(buildUrl());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, [bucketFilter, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate(task: NewTask) {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(err.error ?? `HTTP ${res.status}`);
    }
    await fetchTasks();
  }

  async function handleComplete(id: number | string) {
    const res = await fetch(`/api/tasks/${id}/complete`, { method: "PATCH" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await fetchTasks();
  }

  async function handleDelete(id: number | string) {
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <>
      <AddTaskModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleCreate}
      />

      <div className="min-h-screen bg-background px-4 py-8 sm:px-8">
        {/* ── Header ── */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Tasks</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/20 transition-all"
          >
            <span className="text-base leading-none">+</span> New Task
          </button>
        </div>

        {/* ── Filters ── */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Bucket filter tabs */}
          <div className="flex rounded-xl border border-border bg-card/50 p-1 backdrop-blur-sm">
            {BUCKET_FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setBucketFilter(tab.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  bucketFilter === tab.value
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex rounded-xl border border-border bg-card/50 p-1 backdrop-blur-sm">
            {(["active", "completed"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-3 py-1.5 text-sm capitalize font-medium transition-all ${
                  statusFilter === s
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* ── Task List ── */}
        <div className="rounded-2xl border border-border bg-card/50 p-4 backdrop-blur-xl sm:p-6">
          {/* Error */}
          {error && (
            <div className="mb-4 flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <span>{error}</span>
              <button
                onClick={fetchTasks}
                className="rounded-lg border border-red-500/20 px-3 py-1 text-xs hover:bg-red-500/20"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="text-4xl">✨</span>
              <p className="text-sm text-muted-foreground">
                {statusFilter === "completed"
                  ? "No completed tasks in this bucket."
                  : "No tasks here — you're all caught up!"}
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary hover:bg-primary/20 transition-colors"
              >
                Add your first task
              </button>
            </div>
          ) : (
            <ul className="space-y-2">
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onComplete={handleComplete}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          )}

          {/* Footer count */}
          {!loading && tasks.length > 0 && (
            <p className="mt-4 text-center text-xs text-muted-foreground/50">
              {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
