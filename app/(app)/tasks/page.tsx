"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Check, Trash2, ChevronDown, ChevronRight, Repeat, Timer } from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = "urgent" | "high" | "medium" | "low";
type Bucket = "today" | "this_week" | "upcoming" | "waiting" | "someday";
type StatusFilter = "active" | "completed";
type BucketFilter = "all" | "today" | "this_week" | "upcoming";

interface Task {
  id: number;
  title: string;
  priority: Priority;
  bucket: Bucket;
  status: "active" | "completed";
  dueDate?: string | null;
  description?: string | null;
  parentTaskId?: number | null;
  recurrence?: string | null;
  recurrenceEndDate?: string | null;
  estimatedMinutes?: number | null;
}

interface NewTask {
  title: string;
  priority: Priority;
  bucket: Bucket;
  dueDate: string;
  description: string;
  parentTaskId?: number | null;
  recurrence?: string;
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

const RECURRENCE_LABELS: Record<string, string> = {
  daily: "Daily",
  weekdays: "Weekdays",
  weekly: "Weekly",
  monthly: "Monthly",
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
  parentTask,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (task: NewTask) => Promise<void>;
  parentTask?: Task | null;
}) {
  const [form, setForm] = useState<NewTask>({
    title: "",
    priority: "medium",
    bucket: "today",
    dueDate: "",
    description: "",
    recurrence: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setForm({
        title: "",
        priority: parentTask?.priority ?? "medium",
        bucket: parentTask?.bucket ?? "today",
        dueDate: "",
        description: "",
        parentTaskId: parentTask?.id ?? null,
        recurrence: "",
      });
      setErr(null);
      setTimeout(() => firstRef.current?.focus(), 50);
    }
  }, [open, parentTask]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setErr("Title is required");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const payload: any = { ...form };
      if (!payload.recurrence) delete payload.recurrence;
      if (!payload.dueDate) delete payload.dueDate;
      if (!payload.description) delete payload.description;
      if (!payload.parentTaskId) delete payload.parentTaskId;
      await onSave(payload);
      onClose();
      toast.success(parentTask ? "Subtask added!" : "Task created!");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0f]/95 backdrop-blur-2xl p-6 shadow-2xl">
        <h2 className="mb-5 text-lg font-bold text-white">
          {parentTask ? `Add subtask to "${parentTask.title}"` : "New Task"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-white/50">Title</label>
            <input
              ref={firstRef}
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="What needs to be done?"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-white/50">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-primary/50 focus:outline-none"
              >
                <option value="urgent">🔴 Urgent</option>
                <option value="high">🟠 High</option>
                <option value="medium">🔵 Medium</option>
                <option value="low">⚪ Low</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/50">Bucket</label>
              <select
                value={form.bucket}
                onChange={(e) => setForm({ ...form, bucket: e.target.value as Bucket })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-primary/50 focus:outline-none"
              >
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="upcoming">Upcoming</option>
                <option value="waiting">Waiting</option>
                <option value="someday">Someday</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-white/50">
                Due Date <span className="opacity-50">(optional)</span>
              </label>
              <input
                type="datetime-local"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-primary/50 focus:outline-none"
              />
            </div>
            {!parentTask && (
              <div>
                <label className="mb-1 block text-xs font-medium text-white/50">
                  Repeat <span className="opacity-50">(optional)</span>
                </label>
                <select
                  value={form.recurrence ?? ""}
                  onChange={(e) => setForm({ ...form, recurrence: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-primary/50 focus:outline-none"
                >
                  <option value="">No repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekdays">Weekdays</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-white/50">
              Notes <span className="opacity-50">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Any additional details…"
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none"
            />
          </div>

          {err && <p className="text-xs text-red-400">{err}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/10 bg-transparent py-2.5 text-sm text-white/50 hover:bg-white/5 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50">
              {saving ? "Saving…" : parentTask ? "Add Subtask" : "Add Task"}
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
  subtasks,
  onComplete,
  onDelete,
  onAddSubtask,
  depth = 0,
}: {
  task: Task;
  subtasks: Task[];
  onComplete: (id: number) => void;
  onDelete: (id: number) => void;
  onAddSubtask: (parent: Task) => void;
  depth?: number;
}) {
  const [completing, setCompleting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const hasSubtasks = subtasks.length > 0;
  const completedSubtasks = subtasks.filter(s => s.status === "completed").length;

  return (
    <>
      <li
        style={{ marginLeft: depth * 24 }}
        className={`group flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
          task.status === "completed"
            ? "border-white/5 bg-white/[0.02] opacity-50"
            : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
        }`}
      >
        {/* Expand toggle / Priority dot */}
        {hasSubtasks ? (
          <button onClick={() => setExpanded(!expanded)} className="shrink-0 text-white/30 hover:text-white/60 transition-colors">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <div className={`h-2 w-2 shrink-0 rounded-full ${task.status === "completed" ? "bg-zinc-600" : PRIORITY_DOT[task.priority]}`} />
        )}

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <p className={`truncate text-sm ${task.status === "completed" ? "text-white/30 line-through" : "text-white"}`}>
            {task.title}
          </p>
          <div className="mt-0.5 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-white/30">{BUCKET_LABELS[task.bucket] ?? task.bucket}</span>
            {task.dueDate && (
              <span className={`text-[10px] ${new Date(task.dueDate) < new Date() && task.status === "active" ? "text-red-400" : "text-white/25"}`}>
                · Due {new Date(task.dueDate).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </span>
            )}
            {task.recurrence && (
              <span className="flex items-center gap-0.5 text-[10px] text-primary/60">
                <Repeat className="h-2.5 w-2.5" /> {RECURRENCE_LABELS[task.recurrence] ?? task.recurrence}
              </span>
            )}
            {hasSubtasks && (
              <span className="text-[10px] text-white/25">
                · {completedSubtasks}/{subtasks.length} subtasks
              </span>
            )}
            {task.estimatedMinutes && (
              <span className="flex items-center gap-0.5 text-[10px] text-white/25">
                <Timer className="h-2.5 w-2.5" /> {task.estimatedMinutes}m
              </span>
            )}
          </div>
        </div>

        {/* Priority badge */}
        <span className={`hidden sm:block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${PRIORITY_STYLES[task.priority]}`}>
          {task.priority}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {task.status === "active" && depth === 0 && (
            <button
              onClick={() => onAddSubtask(task)}
              title="Add subtask"
              className="h-7 w-7 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 hover:text-primary hover:border-primary/30 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
          {task.status === "active" && (
            <button
              onClick={async () => { setCompleting(true); await onComplete(task.id); setCompleting(false); }}
              disabled={completing}
              title="Complete"
              className="h-7 w-7 flex items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
            >
              {completing ? <span className="h-3 w-3 animate-spin rounded-full border border-emerald-400 border-t-transparent" /> : <Check className="h-3.5 w-3.5" />}
            </button>
          )}
          <button
            onClick={async () => { setDeleting(true); await onDelete(task.id); setDeleting(false); }}
            disabled={deleting}
            title="Delete"
            className="h-7 w-7 flex items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            {deleting ? <span className="h-3 w-3 animate-spin rounded-full border border-red-400 border-t-transparent" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </li>
      {/* Subtasks */}
      {expanded && subtasks.map(sub => (
        <TaskRow
          key={sub.id}
          task={sub}
          subtasks={[]}
          onComplete={onComplete}
          onDelete={onDelete}
          onAddSubtask={onAddSubtask}
          depth={depth + 1}
        />
      ))}
    </>
  );
}

// ─── Quick Add Bar ────────────────────────────────────────────────────────────

function QuickAdd({ onAdd }: { onAdd: (title: string) => void }) {
  const [value, setValue] = useState("");
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    onAdd(value.trim());
    setValue("");
  }
  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Quick add task… (press Enter)"
        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
      />
      <button type="submit" disabled={!value.trim()} className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-30 transition-opacity">
        Add
      </button>
    </form>
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
  const [subtaskParent, setSubtaskParent] = useState<Task | null>(null);

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

  async function handleQuickAdd(title: string) {
    try {
      await handleCreate({ title, priority: "medium", bucket: "today", dueDate: "", description: "" });
    } catch {
      toast.error("Failed to add task");
    }
  }

  async function handleComplete(id: number) {
    const res = await fetch(`/api/tasks/${id}/complete`, { method: "PATCH" });
    if (res.ok) {
      toast.success("Task completed!");
      await fetchTasks();
    }
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast.success("Task deleted");
    }
  }

  // Organize tasks: top-level first, then subtasks grouped under parents
  const topLevelTasks = tasks.filter(t => !t.parentTaskId);
  const getSubtasks = (parentId: number) => tasks.filter(t => t.parentTaskId === parentId);

  // Stats
  const totalActive = tasks.filter(t => t.status === "active" && !t.parentTaskId).length;
  const totalCompleted = tasks.filter(t => t.status === "completed" && !t.parentTaskId).length;

  return (
    <>
      <AddTaskModal
        open={showModal}
        onClose={() => { setShowModal(false); setSubtaskParent(null); }}
        onSave={handleCreate}
        parentTask={subtaskParent}
      />

      <div className="relative min-h-screen pb-12">
        {/* Ambient */}
        <div className="fixed top-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-primary/8 blur-[150px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8 py-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Tasks</h1>
              <p className="text-sm text-white/40 mt-1">
                {totalActive} active{totalCompleted > 0 ? ` · ${totalCompleted} completed` : ""}
              </p>
            </div>
            <button
              onClick={() => { setSubtaskParent(null); setShowModal(true); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-105 transition-all"
            >
              <Plus className="h-4 w-4" /> New Task
            </button>
          </div>

          {/* Quick Add */}
          <div className="mb-4">
            <QuickAdd onAdd={handleQuickAdd} />
          </div>

          {/* Filters */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
              {BUCKET_FILTER_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setBucketFilter(tab.value)}
                  className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
                    bucketFilter === tab.value
                      ? "bg-primary/20 text-primary"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
              {(["active", "completed"] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-lg px-3.5 py-1.5 text-sm capitalize font-medium transition-all ${
                    statusFilter === s ? "bg-primary/20 text-primary" : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Task List */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 sm:p-6">
            {error && (
              <div className="mb-4 flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                <span>{error}</span>
                <button onClick={fetchTasks} className="rounded-lg border border-red-500/20 px-3 py-1 text-xs hover:bg-red-500/20">
                  Retry
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : topLevelTasks.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <span className="text-4xl">✨</span>
                <p className="text-sm text-white/40">
                  {statusFilter === "completed"
                    ? "No completed tasks in this bucket."
                    : "No tasks here — you're all caught up!"}
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-2 rounded-xl bg-primary/10 border border-primary/30 px-4 py-2 text-sm text-primary hover:bg-primary/20 transition-colors"
                >
                  Add your first task
                </button>
              </div>
            ) : (
              <ul className="space-y-2">
                {topLevelTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    subtasks={getSubtasks(task.id)}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                    onAddSubtask={(parent) => { setSubtaskParent(parent); setShowModal(true); }}
                  />
                ))}
              </ul>
            )}

            {!loading && topLevelTasks.length > 0 && (
              <p className="mt-4 text-center text-xs text-white/20">
                {topLevelTasks.length} {topLevelTasks.length === 1 ? "task" : "tasks"}
                {tasks.length !== topLevelTasks.length ? ` · ${tasks.length - topLevelTasks.length} subtasks` : ""}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
