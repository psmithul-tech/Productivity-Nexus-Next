"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  Users, Plus, Check, Clock, Loader2, AlertCircle, Star, Flame, ArrowRight,
  X, Search, ChevronDown, User, Crown, Sparkles, Target
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

type Task = {
  id: number;
  title: string;
  description?: string | null;
  status: "active" | "completed";
  priority: string;
  bucket: string;
  sharedWith: string[] | null;
  assignedTo: string | null;
  userId: string;
  dueDate?: string | null;
  createdByUsername?: string | null;
  isMyTask?: boolean;
};

type Me = { id: string; email: string };

const PRIORITY_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; dot: string }> = {
  urgent: {
    label: "Urgent",
    color: "border-red-500/40 bg-red-500/10 text-red-400",
    icon: <Flame className="h-3 w-3" />,
    dot: "bg-red-400",
  },
  high: {
    label: "High",
    color: "border-orange-500/40 bg-orange-500/10 text-orange-400",
    icon: <AlertCircle className="h-3 w-3" />,
    dot: "bg-orange-400",
  },
  medium: {
    label: "Medium",
    color: "border-blue-500/40 bg-blue-500/10 text-blue-400",
    icon: <Target className="h-3 w-3" />,
    dot: "bg-blue-400",
  },
  low: {
    label: "Low",
    color: "border-white/20 bg-white/5 text-white/40",
    icon: <Star className="h-3 w-3" />,
    dot: "bg-white/30",
  },
};

function Avatar({ username, size = "sm" }: { username: string | null; size?: "sm" | "md" }) {
  if (!username) return (
    <div className={`${size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs"} rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/30`}>
      <User className="h-3 w-3" />
    </div>
  );
  const initial = username[0].toUpperCase();
  const colors = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-cyan-600",
    "from-emerald-500 to-green-600",
    "from-orange-500 to-amber-600",
    "from-pink-500 to-rose-600",
  ];
  const color = colors[username.charCodeAt(0) % colors.length];
  return (
    <div className={`${size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs"} rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold shadow-lg shrink-0`}>
      {initial}
    </div>
  );
}

function UsernameSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!value || value.length < 2) { setSuggestions([]); setOpen(false); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/username?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        const usernames = (data as { username: string }[]).map(d => d.username).filter(Boolean);
        setSuggestions(usernames);
        setOpen(usernames.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 focus-within:border-violet-500/50 px-3 py-2.5 transition-colors">
        <span className="text-white/30 text-sm font-bold">@</span>
        <input
          value={value}
          onChange={e => onChange(e.target.value.replace(/^@/, ""))}
          placeholder="Search username..."
          className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
        />
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-white/30" />}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 top-full mt-1.5 w-full rounded-xl bg-[#1a1a2e] border border-white/10 shadow-2xl overflow-hidden"
          >
            {suggestions.map(u => (
              <button
                key={u}
                onClick={() => { onChange(u); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-white hover:bg-white/5 transition-colors text-left"
              >
                <Avatar username={u} size="sm" />
                <span className="font-medium">@{u}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AddTaskModal({
  onClose,
  myUsername,
  onSuccess,
}: {
  onClose: () => void;
  myUsername: string | null;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [assignTo, setAssignTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast.error("Title is required"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          priority,
          bucket: "today",
          sharedWith: ["*"], // marks as family board task
          assignedTo: assignTo.trim() || null,
          dueDate: dueDate || null,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Task added to Family Board!");
      onSuccess();
      onClose();
    } catch {
      toast.error("Failed to create task");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative z-10 w-full max-w-lg rounded-2xl bg-[#12122a] border border-white/10 shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Sparkles className="h-4.5 w-4.5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">New Family Task</h2>
                <p className="text-xs text-white/40">Shared on the family board</p>
              </div>
            </div>
            <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Task Title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              className="w-full rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
              className="w-full rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 px-4 py-2.5 text-sm text-white outline-none transition-colors"
              >
                <option value="urgent">🔥 Urgent</option>
                <option value="high">⚠️ High</option>
                <option value="medium">🎯 Medium</option>
                <option value="low">⭐ Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 px-4 py-2.5 text-sm text-white outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Assign To</label>
            <UsernameSearch
              value={assignTo}
              onChange={setAssignTo}
            />
            {myUsername && (
              <p className="text-xs text-white/30 mt-1.5">Leave blank to leave unassigned. You are <span className="text-violet-400 font-medium">@{myUsername}</span></p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-white/60 hover:bg-white/5 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-sm text-white font-bold transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add Task
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function TaskCard({
  task,
  me,
  myUsername,
  onComplete,
  onClaim,
  onAssign,
}: {
  task: Task;
  me: Me | null;
  myUsername: string | null;
  onComplete: (t: Task) => void;
  onClaim: (t: Task) => void;
  onAssign: (t: Task) => void;
}) {
  const isCompleted = task.status === "completed";
  const isAssignedToMe = myUsername && task.assignedTo === myUsername;
  const isMyTask = task.isMyTask ?? task.userId === me?.id;
  const cfg = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;

  const fmtDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    if (days < 0) return { label: `Overdue, ${timeStr}`, cls: "text-red-400" };
    if (days === 0) return { label: `Today, ${timeStr}`, cls: "text-yellow-400" };
    if (days === 1) return { label: `Tomorrow, ${timeStr}`, cls: "text-blue-400" };
    return { label: date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }), cls: "text-white/40" };
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`group p-4 rounded-2xl border transition-all cursor-default ${
        isCompleted
          ? "border-white/5 bg-white/[0.02]"
          : isAssignedToMe
          ? "border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10"
          : "border-white/10 bg-white/5 hover:bg-white/8"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onComplete(task)}
          className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
            isCompleted
              ? "border-violet-500 bg-violet-500"
              : "border-white/20 hover:border-violet-400"
          }`}
        >
          {isCompleted && <Check className="h-3 w-3 text-white" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold leading-snug ${isCompleted ? "line-through text-white/25" : "text-white"}`}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-white/35 mt-0.5 line-clamp-1">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            {/* Priority badge */}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.color}`}>
              {cfg.icon} {cfg.label}
            </span>
            {/* Due date */}
            {task.dueDate && (() => {
              const d = fmtDate(task.dueDate);
              return (
                <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${d.cls}`}>
                  <Clock className="h-3 w-3" />
                  {d.label}
                </span>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {task.assignedTo ? (
            <>
              <Avatar username={task.assignedTo} size="sm" />
              <span className={`text-xs font-medium ${isAssignedToMe ? "text-violet-400" : "text-white/50"}`}>
                @{task.assignedTo} {isAssignedToMe && <span className="text-[10px]">(You)</span>}
              </span>
            </>
          ) : (
            <span className="text-xs text-white/25 italic">Unassigned</span>
          )}
          {task.createdByUsername && !isMyTask && (
            <span className="text-[10px] text-white/25 ml-1">by @{task.createdByUsername}</span>
          )}
        </div>

        {/* Actions */}
        {!isCompleted && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isMyTask && (
              <button
                onClick={() => onAssign(task)}
                className="text-[10px] font-bold text-white/40 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition-all"
              >
                Assign
              </button>
            )}
            <button
              onClick={() => onClaim(task)}
              className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${
                isAssignedToMe
                  ? "text-violet-400 hover:bg-violet-500/10"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              {isAssignedToMe ? "Unclaim" : "Claim"}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

type Filter = "all" | "mine" | "unassigned";

const COLS = [
  { id: "open", label: "Open", color: "text-white/60", dot: "bg-white/20", hint: "Unassigned tasks" },
  { id: "assigned", label: "In Progress", color: "text-violet-400", dot: "bg-violet-400", hint: "Claimed & working" },
  { id: "done", label: "Done", color: "text-emerald-400", dot: "bg-emerald-400", hint: "Completed" },
];

export default function SharedBoardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);
  const [myUsername, setMyUsername] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [assignTarget, setAssignTarget] = useState<Task | null>(null);
  const [assignUsername, setAssignUsername] = useState("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setMe({ id: user.id, email: user.email! });

      // Fetch username from settings
      const settingsRes = await fetch("/api/settings");
      if (settingsRes.ok) {
        const s = await settingsRes.json();
        if (s.username) setMyUsername(s.username);
      }
      await fetchTasks();
    }
    init();
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks/shared");
      if (!res.ok) throw new Error();
      setTasks(await res.json());
    } catch {
      toast.error("Could not load family board");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleComplete = useCallback(async (task: Task) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: t.status === "completed" ? "active" : "completed" } : t));
    try {
      if (task.status === "active") {
        await fetch(`/api/tasks/${task.id}/complete`, { method: "PATCH" });
      } else {
        await fetch(`/api/tasks/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "active", completedAt: null }),
        });
      }
    } catch {
      toast.error("Failed to update task");
      fetchTasks();
    }
  }, [fetchTasks]);

  const handleClaim = useCallback(async (task: Task) => {
    if (!myUsername) {
      toast.error("Set a username in Settings first!");
      return;
    }
    const newAssignedTo = task.assignedTo === myUsername ? null : myUsername;
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, assignedTo: newAssignedTo } : t));
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo: newAssignedTo }),
      });
    } catch {
      toast.error("Failed to claim task");
      fetchTasks();
    }
  }, [myUsername, fetchTasks]);

  const handleAssign = useCallback(async () => {
    if (!assignTarget || !assignUsername.trim()) return;
    setAssigning(true);
    try {
      await fetch(`/api/tasks/${assignTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo: assignUsername.trim() }),
      });
      toast.success(`Assigned to @${assignUsername.trim()}`);
      setAssignTarget(null);
      setAssignUsername("");
      fetchTasks();
    } catch {
      toast.error("Failed to assign task");
    } finally {
      setAssigning(false);
    }
  }, [assignTarget, assignUsername, fetchTasks]);

  const filteredTasks = (colId: string) => {
    let col: Task[];
    if (colId === "open") col = tasks.filter(t => t.status === "active" && !t.assignedTo);
    else if (colId === "assigned") col = tasks.filter(t => t.status === "active" && !!t.assignedTo);
    else col = tasks.filter(t => t.status === "completed");

    if (filter === "mine") col = col.filter(t => t.assignedTo === myUsername || t.userId === me?.id);
    if (filter === "unassigned") col = col.filter(t => !t.assignedTo);
    return col;
  };

  const totalOpen = tasks.filter(t => t.status === "active").length;
  const totalDone = tasks.filter(t => t.status === "completed").length;

  return (
    <div className="relative min-h-screen pb-12">
      {/* Ambient */}
      <div className="fixed top-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-violet-500/8 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-blue-600/8 blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-white">Family Board</h1>
                <p className="text-xs text-white/40 flex items-center gap-2 mt-0.5">
                  {myUsername ? (
                    <><span className="text-violet-400 font-medium">@{myUsername}</span> · Shared household workspace</>
                  ) : (
                    <span className="text-yellow-400/80">⚠ Set a username in Settings to assign tasks</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <div className="text-xs text-white/40 bg-white/5 border border-white/5 px-3 py-1.5 rounded-full">
                <span className="font-bold text-white">{totalOpen}</span> open
              </div>
              <div className="text-xs text-white/40 bg-emerald-500/5 border border-emerald-500/10 px-3 py-1.5 rounded-full">
                <span className="font-bold text-emerald-400">{totalDone}</span> done
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Filter Pills */}
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
              {(["all", "mine", "unassigned"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                    filter === f
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold shadow-lg shadow-violet-500/20 transition-all"
            >
              <Plus className="h-4 w-4" /> Add Task
            </button>
          </div>
        </div>

        {/* Kanban Board */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COLS.map(col => (
              <div key={col.id} className="rounded-3xl border border-white/8 bg-white/3 p-4 min-h-[500px]">
                <div className="flex items-center gap-2 mb-4 px-1">
                  <div className="h-2 w-2 rounded-full bg-white/10 animate-pulse" />
                  <div className="h-3 w-20 rounded-full bg-white/10 animate-pulse" />
                </div>
                {[1, 2, 3].map(i => (
                  <div key={i} className="mb-3 h-24 rounded-2xl bg-white/5 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COLS.map(col => {
              const colTasks = filteredTasks(col.id);
              return (
                <div
                  key={col.id}
                  className="flex flex-col rounded-3xl border border-white/8 bg-white/[0.025] backdrop-blur-sm min-h-[500px]"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between p-4 pb-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${col.dot}`} />
                      <h2 className={`text-xs font-bold uppercase tracking-wider ${col.color}`}>{col.label}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/25">{col.hint}</span>
                      <span className="text-xs font-bold text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                        {colTasks.length}
                      </span>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 flex flex-col gap-3 p-4">
                    <AnimatePresence mode="popLayout">
                      {colTasks.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex-1 flex flex-col items-center justify-center py-12 text-center"
                        >
                          <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
                            {col.id === "open" ? <Plus className="h-5 w-5 text-white/20" /> : col.id === "assigned" ? <User className="h-5 w-5 text-white/20" /> : <Check className="h-5 w-5 text-white/20" />}
                          </div>
                          <p className="text-xs text-white/25 font-medium">No tasks here</p>
                        </motion.div>
                      ) : (
                        colTasks.map(task => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            me={me}
                            myUsername={myUsername}
                            onComplete={handleComplete}
                            onClaim={handleClaim}
                            onAssign={(t) => { setAssignTarget(t); setAssignUsername(t.assignedTo ?? ""); }}
                          />
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showAdd && (
          <AddTaskModal
            myUsername={myUsername}
            onClose={() => setShowAdd(false)}
            onSuccess={fetchTasks}
          />
        )}
      </AnimatePresence>

      {/* Assign Modal */}
      <AnimatePresence>
        {assignTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAssignTarget(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-sm rounded-2xl bg-[#12122a] border border-white/10 shadow-2xl p-6"
            >
              <h3 className="text-base font-bold text-white mb-1">Assign Task</h3>
              <p className="text-xs text-white/40 mb-5 line-clamp-1">"{assignTarget.title}"</p>
              <UsernameSearch value={assignUsername} onChange={setAssignUsername} />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setAssignTarget(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-white/50 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  disabled={!assignUsername.trim() || assigning}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-sm text-white font-bold transition-colors flex items-center justify-center gap-2"
                >
                  {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  Assign
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
