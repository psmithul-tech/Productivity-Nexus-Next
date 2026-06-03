"use client";

import { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReminderChannel = "email" | "push" | "telegram";
type ReminderStatus = "pending" | "snoozed" | "sent";

interface Reminder {
  id: number | string;
  taskId: number | string;
  taskTitle?: string;
  channel: ReminderChannel;
  scheduledAt: string;
  status: ReminderStatus;
  snoozeUntil?: string;
}

interface NewReminder {
  taskId: string;
  channel: ReminderChannel;
  scheduledAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CHANNEL_BADGES: Record<ReminderChannel, string> = {
  email: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  push: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  telegram: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
};

const CHANNEL_ICONS: Record<ReminderChannel, string> = {
  email: "✉️",
  push: "🔔",
  telegram: "💬",
};

const STATUS_BADGES: Record<ReminderStatus, string> = {
  pending: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  snoozed: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  sent: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
};

const STATUS_DOTS: Record<ReminderStatus, string> = {
  pending: "bg-blue-400",
  snoozed: "bg-amber-400",
  sent: "bg-emerald-400",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Add Reminder Form ────────────────────────────────────────────────────────

function AddReminderForm({
  onSave,
}: {
  onSave: (r: NewReminder) => Promise<void>;
}) {
  const [form, setForm] = useState<NewReminder>({
    taskId: "",
    channel: "push",
    scheduledAt: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.taskId || isNaN(Number(form.taskId))) {
      setErr("Valid Task ID is required");
      return;
    }
    if (!form.scheduledAt) {
      setErr("Scheduled time is required");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await onSave({
        ...form,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
      });
      setForm({ taskId: "", channel: "push", scheduledAt: "" });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5 backdrop-blur-xl sm:p-6">
      <h2 className="mb-4 text-base font-semibold text-foreground">Add Reminder</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Task ID */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Task ID</label>
            <input
              type="number"
              value={form.taskId}
              onChange={(e) => setForm({ ...form, taskId: e.target.value })}
              placeholder="42"
              min={1}
              className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          {/* Channel */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Channel</label>
            <select
              value={form.channel}
              onChange={(e) => setForm({ ...form, channel: e.target.value as ReminderChannel })}
              className="w-full rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            >
              <option value="push">🔔 Push</option>
              <option value="email">✉️ Email</option>
              <option value="telegram">💬 Telegram</option>
            </select>
          </div>

          {/* Scheduled At */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Scheduled At</label>
            <input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
              className="w-full rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>

        {err && <p className="text-xs text-red-400">{err}</p>}
        {success && (
          <p className="text-xs text-emerald-400">✓ Reminder added successfully</p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl border border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add Reminder"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Reminder Card ────────────────────────────────────────────────────────────

function ReminderCard({
  reminder,
  onSnooze,
  onDelete,
}: {
  reminder: Reminder;
  onSnooze: (id: number | string) => Promise<void>;
  onDelete: (id: number | string) => Promise<void>;
}) {
  const [snoozing, setSnoozing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <li className="group flex items-start gap-4 rounded-xl border border-border/50 bg-background/30 px-4 py-4 transition-all hover:bg-background/50">
      {/* Status indicator */}
      <div className="mt-0.5 flex flex-col items-center gap-1.5">
        <div className={`h-2.5 w-2.5 rounded-full ${STATUS_DOTS[reminder.status]}`} />
        <span className="text-base">{CHANNEL_ICONS[reminder.channel]}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-start gap-2">
          <p className="text-sm font-medium text-foreground">
            {reminder.taskTitle ? (
              <span className="truncate">{reminder.taskTitle}</span>
            ) : (
              <span className="text-muted-foreground">Task #{reminder.taskId}</span>
            )}
          </p>

          {/* Channel badge */}
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
              CHANNEL_BADGES[reminder.channel]
            }`}
          >
            {reminder.channel}
          </span>

          {/* Status badge */}
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${
              STATUS_BADGES[reminder.status]
            }`}
          >
            {reminder.status}
          </span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>🕐 {formatDateTime(reminder.scheduledAt)}</span>
          {reminder.status === "snoozed" && reminder.snoozeUntil && (
            <span className="text-amber-400/80">
              Snoozed until {formatDateTime(reminder.snoozeUntil)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-shrink-0 items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        {reminder.status !== "sent" && (
          <button
            onClick={async () => {
              setSnoozing(true);
              try { await onSnooze(reminder.id); } finally { setSnoozing(false); }
            }}
            disabled={snoozing}
            title="Snooze 30 min"
            className="flex h-8 items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 text-xs text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
          >
            {snoozing ? (
              <span className="h-3 w-3 animate-spin rounded-full border border-amber-400 border-t-transparent" />
            ) : (
              "⏰"
            )}
            <span className="hidden sm:inline">Snooze</span>
          </button>
        )}
        <button
          onClick={async () => {
            setDeleting(true);
            try { await onDelete(reminder.id); } finally { setDeleting(false); }
          }}
          disabled={deleting}
          title="Delete"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          {deleting ? (
            <span className="h-3 w-3 animate-spin rounded-full border border-red-400 border-t-transparent" />
          ) : (
            "✕"
          )}
        </button>
      </div>
    </li>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ReminderStatus | "all">("all");

  async function fetchReminders() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reminders");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setReminders(Array.isArray(data) ? data : data.reminders ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReminders();
  }, []);

  async function handleCreate(r: NewReminder) {
    const res = await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...r, taskId: Number(r.taskId) }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(err.error ?? `HTTP ${res.status}`);
    }
    await fetchReminders();
  }

  async function handleSnooze(id: number | string) {
    const snoozeUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const res = await fetch(`/api/reminders/${id}/snooze`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ snoozeUntil }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    setReminders(prev =>
      prev.map(r =>
        r.id === id ? { ...r, status: "snoozed", snoozeUntil } : r
      )
    );
  }

  async function handleDelete(id: number | string) {
    const res = await fetch(`/api/reminders/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    setReminders(prev => prev.filter(r => r.id !== id));
  }

  const filtered =
    statusFilter === "all"
      ? reminders
      : reminders.filter(r => r.status === statusFilter);

  const counts = {
    all: reminders.length,
    pending: reminders.filter(r => r.status === "pending").length,
    snoozed: reminders.filter(r => r.status === "snoozed").length,
    sent: reminders.filter(r => r.status === "sent").length,
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-8">
      {/* ── Header ── */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Reminders</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {counts.pending} pending · {counts.snoozed} snoozed
          </p>
        </div>
        <button
          onClick={fetchReminders}
          className="rounded-xl border border-border bg-card/50 px-4 py-2 text-sm text-muted-foreground backdrop-blur hover:text-foreground transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* ── Add Form ── */}
      <div className="mb-6">
        <AddReminderForm onSave={handleCreate} />
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-400">
          <span>{error}</span>
          <button
            onClick={fetchReminders}
            className="rounded-lg border border-red-500/30 px-3 py-1 text-xs hover:bg-red-500/20"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Filter Tabs ── */}
      <div className="mb-4 flex rounded-xl border border-border bg-card/50 p-1 backdrop-blur-sm w-fit">
        {(["all", "pending", "snoozed", "sent"] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm capitalize font-medium transition-all ${
              statusFilter === s
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                statusFilter === s ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground"
              }`}
            >
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* ── List ── */}
      <div className="rounded-2xl border border-border bg-card/50 p-4 backdrop-blur-xl sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-4xl">🔕</span>
            <p className="text-sm text-muted-foreground">
              {statusFilter === "all"
                ? "No reminders yet — add one above."
                : `No ${statusFilter} reminders.`}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map(r => (
              <ReminderCard
                key={r.id}
                reminder={r}
                onSnooze={handleSnooze}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}

        {!loading && filtered.length > 0 && (
          <p className="mt-4 text-center text-xs text-muted-foreground/50">
            {filtered.length} reminder{filtered.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
}
