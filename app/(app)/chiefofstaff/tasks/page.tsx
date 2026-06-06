"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Check, Trash2, ChevronDown, ChevronRight, Repeat, Timer } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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
  assignedTo?: string | null;
}

interface NewTask {
  title: string;
  priority: Priority;
  bucket: Bucket;
  dueDate: string;
  description: string;
  parentTaskId?: number | null;
  recurrence?: string;
  assignedTo?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PRIORITY_STYLES: Record<Priority, string> = {
  urgent: "bg-surface-variant0 text-error border-error",
  high: "bg-orange-500/10 text-orange-500 border-orange-500",
  medium: "bg-secondary-container/30 text-secondary border-secondary/30",
  low: "bg-surface-variant text-on-surface-variant border-outline-variant",
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
    assignedTo: "",
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
        assignedTo: "",
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
      if (!payload.assignedTo) delete payload.assignedTo;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 page-enter" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/20 dark:bg-surface shadow-sm rounded-3xl" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-surface rounded-[24px] p-8 shadow-[0_4px_0_0_#000] dark:shadow-lg border-[3px] border-black dark:border-outline-variant/30">
        <h2 className="mb-5 font-headline-sm text-headline-sm text-on-surface">
          {parentTask ? `Add subtask to "${parentTask.title}"` : "New Task"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block font-mono-label text-mono-label text-on-surface-variant">Title</label>
            <input
              ref={firstRef}
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="What needs to be done?"
              className="w-full rounded bg-surface-container-high border border-outline-variant/30 px-4 py-2 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-mono-label text-mono-label text-on-surface-variant">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
                className="w-full rounded bg-surface-container-high border border-outline-variant/30 px-3 py-2 font-body-sm text-body-sm text-on-surface focus:border-primary focus:outline-none"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block font-mono-label text-mono-label text-on-surface-variant">Bucket</label>
              <select
                value={form.bucket}
                onChange={(e) => setForm({ ...form, bucket: e.target.value as Bucket })}
                className="w-full rounded bg-surface-container-high border border-outline-variant/30 px-3 py-2 font-body-sm text-body-sm text-on-surface focus:border-primary focus:outline-none"
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
              <label className="mb-1 block font-mono-label text-mono-label text-on-surface-variant">
                Due Date <span className="opacity-50">(optional)</span>
              </label>
              <input
                type="datetime-local"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full rounded bg-surface-container-high border border-outline-variant/30 px-4 py-2 font-body-sm text-body-sm text-on-surface focus:border-primary focus:outline-none"
              />
            </div>
            {!parentTask && (
              <div>
                <label className="mb-1 block font-mono-label text-mono-label text-on-surface-variant">
                  Repeat <span className="opacity-50">(optional)</span>
                </label>
                <select
                  value={form.recurrence ?? ""}
                  onChange={(e) => setForm({ ...form, recurrence: e.target.value })}
                  className="w-full rounded bg-surface-container-high border border-outline-variant/30 px-3 py-2 font-body-sm text-body-sm text-on-surface focus:border-primary focus:outline-none"
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
            <label className="mb-1 block font-mono-label text-mono-label text-on-surface-variant">
              Notes <span className="opacity-50">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Any additional details…"
              className="w-full resize-none rounded bg-surface-container-high border border-outline-variant/30 px-4 py-2 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block font-mono-label text-mono-label text-on-surface-variant">
              Assign To <span className="opacity-50">(username, optional)</span>
            </label>
            <input
              type="text"
              value={form.assignedTo ?? ""}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
              placeholder="e.g. mika"
              className="w-full rounded bg-surface-container-high border border-outline-variant/30 px-4 py-2 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          {err && <p className="font-mono-label text-mono-label text-error">{err}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded border border-outline-variant/50 bg-surface-container-low py-2 font-mono-label text-mono-label text-on-surface-variant hover:bg-surface-container transition-colors">
              CANCEL
            </button>
            <button type="submit" disabled={saving} className="flex-1 rounded bg-primary py-2 font-mono-label text-mono-label text-on-primary hover:bg-primary-dim transition-colors disabled:opacity-50">
              {saving ? "SAVING…" : parentTask ? "ADD SUBTASK" : "ADD TASK"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Task Drawer ─────────────────────────────────────────────────────────────

function TaskDrawer({
  task,
  subtasks,
  open,
  onClose,
  onComplete,
  onDelete,
  onAddSubtask,
  onEdit
}: {
  task: Task | null;
  subtasks: Task[];
  open: boolean;
  onClose: () => void;
  onComplete: (id: number) => void;
  onDelete: (id: number) => void;
  onAddSubtask: (parent: Task) => void;
  onEdit: () => void;
}) {
  if (!task) return null;
  const completedSubtasks = subtasks.filter(s => s.status === "completed").length;

  return (
    <div className={"fixed inset-0 z-50 pointer-events-none " + (open ? 'opacity-100' : 'opacity-0')} style={{ transition: 'opacity 0.3s ease-in-out' }}>
      <div className={"absolute inset-0 bg-background/50 backdrop-blur-sm transition-opacity " + (open ? 'opacity-100 pointer-events-auto' : 'opacity-0')} onClick={onClose} />
      <aside 
        className={"w-[400px] max-w-[90vw] bg-white dark:bg-surface border-l-[3px] border-black dark:border-outline-variant/30 shadow-xl flex flex-col transform " + (open ? 'translate-x-0' : 'translate-x-full') + " transition-transform duration-300 ease-in-out absolute right-0 top-0 h-full pointer-events-auto"}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-lg border-b border-outline-variant/20 shrink-0">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">dock_to_right</span>
            <span className="font-mono-label text-mono-label uppercase tracking-wider">Task Details</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1 rounded-full hover:bg-surface-container-high transition-colors text-error" onClick={() => { onDelete(task.id); onClose(); }}>
              <span className="material-symbols-outlined text-[20px]">delete</span>
            </button>
            <button className="p-1 rounded-full hover:bg-surface-container-high transition-colors text-on-surface" onClick={onClose}>
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-lg flex flex-col gap-6 custom-scrollbar">
          {/* Title & Core Meta */}
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface mb-4">{task.title}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-mono-label text-mono-label text-on-surface-variant mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${task.status === 'active' ? 'bg-primary animate-pulse' : 'bg-outline-variant'}`}></span>
                  <span className="font-body-sm text-body-sm text-on-surface">{task.status === 'active' ? 'In Progress' : 'Completed'}</span>
                </div>
              </div>
              <div>
                <p className="font-mono-label text-mono-label text-on-surface-variant mb-1">Priority</p>
                <div className={"flex items-center gap-1 " + PRIORITY_STYLES[task.priority].split(' ')[1]}>
                  <span className="material-symbols-outlined textbg-surface-container icon-fill">flag</span>
                  <span className="font-body-sm text-body-sm capitalize">{task.priority}</span>
                </div>
              </div>
              <div>
                <p className="font-mono-label text-mono-label text-on-surface-variant mb-1">Due Date</p>
                <p className="font-body-sm text-body-sm text-on-surface">
                  {task.dueDate ? new Date(task.dueDate).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : 'None'}
                </p>
              </div>
              <div>
                <p className="font-mono-label text-mono-label text-on-surface-variant mb-1">Bucket</p>
                <span className="px-2 py-0.5 rounded bg-surface-variant font-mono-label text-mono-label text-on-surface-variant inline-block border border-outline-variant/30">
                  {BUCKET_LABELS[task.bucket] ?? task.bucket}
                </span>
              </div>
              <div>
                <p className="font-mono-label text-mono-label text-on-surface-variant mb-1">Assigned To</p>
                <p className="font-body-sm text-body-sm text-on-surface">
                  {task.assignedTo || 'Unassigned'}
                </p>
              </div>
            </div>
          </div>

          <hr className="border-outline-variant/20" />

          {/* Description */}
          {task.description && (
            <div>
              <p className="font-mono-label text-mono-label text-on-surface-variant mb-2">Description</p>
              <p className="font-body-sm text-body-sm text-on-surface/80 leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          {/* Subtasks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="font-mono-label text-mono-label text-on-surface-variant">Subtasks</p>
              <div className="flex items-center gap-3">
                <span className="font-mono-label text-mono-label text-primary">{completedSubtasks}/{subtasks.length}</span>
                <button onClick={() => onAddSubtask(task)} className="text-primary hover:text-primary-dim transition-colors">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>
            </div>
            {subtasks.length === 0 ? (
              <p className="font-mono-label text-mono-label text-on-surface-variant/50">No subtasks.</p>
            ) : (
              <div className="space-y-2">
                {subtasks.map(sub => (
                  <div key={sub.id} className={"flex items-start gap-3 " + (sub.status === 'completed' ? 'opacity-50' : '')}>
                    <button onClick={() => onComplete(sub.id)} className="shrink-0">
                      {sub.status === 'completed' ? (
                        <span className="material-symbols-outlined text-[18px] text-primary mt-0.5 icon-fill">check_box</span>
                      ) : (
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant mt-0.5 hover:text-primary transition-colors">check_box_outline_blank</span>
                      )}
                    </button>
                    <span className={"font-body-sm text-body-sm text-on-surface " + (sub.status === 'completed' ? 'line-through' : '')}>{sub.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-lg border-t border-outline-variant/20 mt-auto shrink-0 flex gap-3">
          <button className="flex-1 bg-surface-container text-on-surface-variant font-mono-label text-xs font-bold py-3 rounded-xl hover:bg-surface-container-high transition-colors" onClick={() => {}}>
            EDIT
          </button>
          <button 
            className={`flex-1 bg-primary text-on-primary font-mono-label text-xs font-bold py-3 rounded-xl hover:bg-primary/90 transition-all ${task.status === 'completed' ? 'opacity-50' : ''}`}
            onClick={() => onComplete(task.id)}
            disabled={task.status === 'completed'}
          >
            {task.status === 'completed' ? 'COMPLETED' : 'MARK COMPLETE'}
          </button>
        </div>
      </aside>
    </div>
  );
}

// ─── Task Item ─────────────────────────────────────────────────────────────────

function TaskRow({
  task,
  subtasks,
  onClick,
  onComplete,
}: {
  task: Task;
  subtasks: Task[];
  onClick: (task: Task) => void;
  onComplete: (id: number) => void;
}) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  
  return (
    <div 
      className={"group flex items-center gap-4 p-5 rounded-[20px] transition-all cursor-pointer border-[2px] mb-3 " + (task.status === 'completed' ? 'opacity-60 grayscale border-black dark:border-outline-variant/10 bg-gray-50 dark:bg-surface/30' : 'bg-white dark:bg-surface border-black dark:border-outline-variant/20 shadow-[0_3px_0_0_#000] dark:shadow-none hover:translate-y-[2px] hover:shadow-[0_1px_0_0_#000] dark:hover:shadow-none')}
      onClick={() => onClick(task)}
    >
      <button 
        className={"w-7 h-7 rounded-xl border-2 flex items-center justify-center shrink-0 transition-colors " + (task.status === 'completed' ? 'border-primary bg-primary' : 'border-outline-variant hover:border-primary hover:bg-primary/10')}
        onClick={(e) => { e.stopPropagation(); onComplete(task.id); }}
      >
        {task.status === 'completed' && <span className="material-symbols-outlined text-[18px] text-on-primary icon-fill">check</span>}
      </button>

      <div className="flex-1 min-w-0">
        <p className={"font-headline-sm text-lg text-on-surface truncate group-hover:text-primary transition-colors " + (task.status === 'completed' ? 'line-through text-on-surface-variant' : 'font-bold')}>
          {task.title}
        </p>
        <div className="flex items-center gap-3 mt-1.5 opacity-80">
          {(task.priority === "urgent" || task.priority === "high") && (
            <span className={"font-mono-label text-xs px-2 py-0.5 rounded-full flex items-center gap-1 border " + PRIORITY_STYLES[task.priority]}>
              <span className="material-symbols-outlined text-[14px]">flag</span> {task.priority}
            </span>
          )}
          {task.dueDate && (
            <>
              {(task.priority === "urgent" || task.priority === "high") && <span className="w-1 h-1 rounded-full bg-outline-variant"></span>}
              <span className={"font-mono-label text-xs flex items-center gap-1 " + (isOverdue && task.status === 'active' ? 'text-error font-bold' : 'text-on-surface-variant')}>
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                {new Date(task.dueDate).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            </>
          )}
          {task.assignedTo && (
            <>
              {((task.priority === "urgent" || task.priority === "high") || task.dueDate) && <span className="w-1 h-1 rounded-full bg-outline-variant"></span>}
              <span className="font-mono-label text-[10px] uppercase tracking-wider flex items-center gap-1 text-primary bg-primary/10 px-2 py-0.5 rounded">
                <span className="material-symbols-outlined text-[12px]">person</span>
                {task.assignedTo}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {subtasks.length > 0 && (
          <div className="flex items-center gap-1.5 text-on-surface-variant bg-surface-container-low px-2.5 py-1 rounded-lg border border-outline-variant/20" title="Subtasks">
            <span className="material-symbols-outlined text-[14px]">account_tree</span>
            <span className="font-mono-label text-xs font-bold">{subtasks.filter(s => s.status === 'completed').length}/{subtasks.length}</span>
          </div>
        )}
        <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors">
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </div>
      </div>
    </div>
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
    <form onSubmit={handleSubmit} className="flex gap-2 relative">
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">add</span>
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Quick add task… (press Enter)"
        className="flex-1 bg-white dark:bg-surface-container-lowest border-[2px] border-black dark:border-outline-variant/30 rounded-2xl py-3.5 pl-10 pr-4 font-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/20 transition-all w-full shadow-[0_2px_0_0_#000] dark:shadow-inner hover:translate-y-[1px] hover:shadow-[0_1px_0_0_#000] dark:hover:shadow-inner"
      />
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
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (bucketFilter !== "all") params.set("bucket", bucketFilter);
    return `/api/tasks?\${params.toString()}`;
  }, [bucketFilter, statusFilter]);

  async function fetchTasks() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(buildUrl());
      if (!res.ok) throw new Error(`HTTP \${res.status}`);
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
      throw new Error(err.error ?? `HTTP \${res.status}`);
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
    const res = await fetch(`/api/tasks/\${id}/complete`, { method: "PATCH" });
    if (res.ok) {
      toast.success("Task completed!");
      await fetchTasks();
      if (selectedTask?.id === id) {
        setSelectedTask({ ...selectedTask, status: "completed" });
      }
    }
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/tasks/\${id}`, { method: "DELETE" });
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast.success("Task deleted");
      if (selectedTask?.id === id) setSelectedTask(null);
    }
  }

  // Organize tasks: top-level first, then subtasks grouped under parents
  const topLevelTasks = tasks.filter(t => !t.parentTaskId && t.status === statusFilter);
  const getSubtasks = (parentId: number) => tasks.filter(t => t.parentTaskId === parentId);

  const sortTasks = (taskArray: Task[]) => {
    return [...taskArray].sort((a, b) => {
      if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
      
      // Due Date First
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;

      // Priority Second
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      
      return b.id - a.id;
    });
  };

  // Group by bucket logic
  const todayTasks = sortTasks(topLevelTasks.filter(t => t.bucket === 'today'));
  const thisWeekTasks = sortTasks(topLevelTasks.filter(t => t.bucket === 'this_week'));
  const otherTasks = sortTasks(topLevelTasks.filter(t => t.bucket !== 'today' && t.bucket !== 'this_week'));

  return (
    <>
      <AddTaskModal
        open={showModal}
        onClose={() => { setShowModal(false); setSubtaskParent(null); }}
        onSave={handleCreate}
        parentTask={subtaskParent}
      />
      
      <TaskDrawer 
        open={!!selectedTask}
        task={selectedTask}
        subtasks={selectedTask ? getSubtasks(selectedTask.id) : []}
        onClose={() => setSelectedTask(null)}
        onComplete={handleComplete}
        onDelete={handleDelete}
        onAddSubtask={(parent) => { setSubtaskParent(parent); setShowModal(true); }}
        onEdit={() => {}}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden w-full max-w-container-max mx-auto page-enter relative">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-outline-variant/10 shrink-0">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Filters */}
            <select 
              value={bucketFilter}
              onChange={(e) => setBucketFilter(e.target.value as BucketFilter)}
              className="px-3 py-1.5 rounded bg-surface-container-low border border-outline-variant/30 hover:border-outline-variant transition-colors font-mono-label text-mono-label text-on-surface focus:outline-none"
            >
              {BUCKET_FILTER_TABS.map(tab => (
                <option key={tab.value} value={tab.value}>{tab.label}</option>
              ))}
            </select>
            
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-3 py-1.5 rounded bg-surface-container-low border border-outline-variant/30 hover:border-outline-variant transition-colors font-mono-label text-mono-label text-on-surface focus:outline-none"
            >
              <option value="active">Active Status</option>
              <option value="completed">Completed Status</option>
            </select>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none w-[300px]">
              <QuickAdd onAdd={handleQuickAdd} />
            </div>
            {/* Add Task CTA */}
            <button 
              onClick={() => { setSubtaskParent(null); setShowModal(true); }}
              className="flex items-center gap-2 bg-[#06D6A0] dark:bg-primary text-black dark:text-on-primary border-[2px] border-black dark:border-transparent hover:translate-y-[2px] px-6 py-3.5 rounded-2xl transition-all group shrink-0 shadow-[0_3px_0_0_#000] dark:shadow-none hover:shadow-[0_1px_0_0_#000] dark:hover:shadow-none"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:rotate-90 transition-transform">add</span>
              <span className="font-mono-label text-xs font-bold uppercase tracking-widest hidden sm:inline">Add Task</span>
            </button>
          </div>
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto py-lg space-y-8 custom-scrollbar pr-2">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : topLevelTasks.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="material-symbols-outlined text-4xl text-outline mb-2">assignment_turned_in</span>
              <p className="font-mono-label text-mono-label text-on-surface-variant">
                {statusFilter === "completed"
                  ? "No completed tasks in this bucket."
                  : "No tasks here — you're all caught up!"}
              </p>
            </div>
          ) : (
            <>
              {/* Group: Today */}
              {todayTasks.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="font-headline-sm text-headline-sm text-primary-dim">Today</h3>
                    <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent"></div>
                    <span className="font-mono-label text-mono-label text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">{todayTasks.length} items</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {todayTasks.map(task => (
                      <TaskRow 
                        key={task.id} 
                        task={task} 
                        subtasks={getSubtasks(task.id)} 
                        onClick={setSelectedTask} 
                        onComplete={handleComplete} 
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Group: This Week */}
              {thisWeekTasks.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-4 mt-8">
                    <h3 className="font-headline-sm text-headline-sm text-outline">This Week</h3>
                    <div className="h-px flex-1 bg-gradient-to-r from-outline-variant/30 to-transparent"></div>
                    <span className="font-mono-label text-mono-label text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">{thisWeekTasks.length} items</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {thisWeekTasks.map(task => (
                      <TaskRow 
                        key={task.id} 
                        task={task} 
                        subtasks={getSubtasks(task.id)} 
                        onClick={setSelectedTask} 
                        onComplete={handleComplete} 
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Group: Other/Upcoming */}
              {otherTasks.length > 0 && (
                <section className={statusFilter === 'completed' ? "opacity-50" : ""}>
                  <div className="flex items-center gap-3 mb-4 mt-8">
                    <h3 className={"font-headline-sm text-headline-sm text-outline " + (statusFilter === 'completed' ? 'line-through' : '')}>
                      {statusFilter === 'completed' ? 'Completed' : 'Upcoming / Later'}
                    </h3>
                    <div className="h-px flex-1 bg-gradient-to-r from-outline-variant/30 to-transparent"></div>
                    <span className="font-mono-label text-mono-label text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">{otherTasks.length} items</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {otherTasks.map(task => (
                      <TaskRow 
                        key={task.id} 
                        task={task} 
                        subtasks={getSubtasks(task.id)} 
                        onClick={setSelectedTask} 
                        onComplete={handleComplete} 
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
