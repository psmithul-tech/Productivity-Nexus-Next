"use client";

import { useEffect, useState } from "react";

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

const CHANNEL_ICONS: Record<ReminderChannel, string> = {
  email: "mail",
  push: "notifications",
  telegram: "send",
};

const STATUS_COLORS: Record<ReminderStatus, string> = {
  pending: "text-primary border-primary",
  snoozed: "text-amber-400 border-amber-400",
  sent: "text-emerald-400 border-emerald-400",
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
    channel: "telegram",
    scheduledAt: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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
      setForm({ taskId: "", channel: "telegram", scheduledAt: "" });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white dark:bg-surface border-[3px] border-black dark:border-outline-variant/20 p-6 lg:p-8 rounded-[32px] flex flex-col gap-6 shadow-[0_4px_0_0_#000] dark:shadow-sm relative overflow-hidden mb-8">
      <div className="flex items-center gap-2 border-b-[3px] border-black dark:border-outline-variant/10 pb-4">
        <span className="material-symbols-outlined text-[#EF476F] dark:text-primary text-xl">rocket_launch</span>
        <h2 className="font-headline-sm text-xl font-bold text-on-surface">Execute Reminder Protocol</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-start md:items-center w-full">
        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Task ID */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">tag</span>
            <input
              type="number"
              value={form.taskId}
              onChange={(e) => setForm({ ...form, taskId: e.target.value })}
              className="w-full bg-[#F0F4F8] dark:bg-surface-container border-[2px] border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-none text-on-surface pl-12 pr-4 h-[48px] rounded-xl focus:outline-none transition-all placeholder-on-surface-variant/40 font-body-lg text-[15px]"
              placeholder="Task ID"
              min={1}
            />
          </div>

          {/* Channel */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">hub</span>
            <select
              value={form.channel}
              onChange={(e) => setForm({ ...form, channel: e.target.value as ReminderChannel })}
              className="w-full bg-[#F0F4F8] dark:bg-surface-container border-[2px] border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-none text-on-surface pl-12 pr-4 h-[48px] rounded-xl focus:outline-none transition-all font-body-lg text-[15px] appearance-none"
            >
              <option value="telegram">Telegram</option>
              <option value="push">Push</option>
              <option value="email">Email</option>
            </select>
          </div>

          {/* Scheduled At */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">schedule</span>
            <input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
              className="w-full bg-[#F0F4F8] dark:bg-surface-container border-[2px] border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-none text-on-surface pl-12 pr-4 h-[48px] rounded-xl focus:outline-none transition-all font-body-lg text-[15px]"
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={saving}
          className="h-[48px] border-[2px] border-black dark:border-outline-variant/30 text-black dark:text-on-surface px-6 rounded-xl font-bold text-[13px] bg-white dark:bg-transparent shadow-[0_3px_0_0_#000] dark:shadow-none hover:translate-y-[2px] hover:shadow-[0_1px_0_0_#000] dark:hover:shadow-none hover:border-black dark:hover:border-primary transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-w-[120px]"
        >
          {saving ? (
            <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
          ) : (
            <>
              <span className="material-symbols-outlined text-[16px]">add</span>
              Deploy
            </>
          )}
        </button>
      </form>
      {err && <p className="text-xs text-error mt-2 font-mono-label">{err}</p>}
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
    <div className="bg-white dark:bg-surface-container rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between hover:translate-y-[2px] hover:shadow-[0_1px_0_0_#000] dark:hover:shadow-sm transition-all group gap-4 border-[2px] border-black dark:border-transparent shadow-[0_3px_0_0_#000] dark:shadow-none">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 mt-1 md:mt-0 rounded-full bg-white dark:bg-surface border-[2px] border-black dark:border-outline-variant/30 flex items-center justify-center text-primary shrink-0 shadow-[0_2px_0_0_#000] dark:shadow-none">
          <span className="material-symbols-outlined text-[20px]">{CHANNEL_ICONS[reminder.channel]}</span>
        </div>
        <div className="flex flex-col">
          <span className="font-body-lg text-[15px] text-on-surface font-semibold tracking-wide">
            {reminder.taskTitle ? reminder.taskTitle : `Task #${reminder.taskId}`}
          </span>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span className="font-mono-label text-xs text-on-surface-variant flex items-center gap-1 bg-white dark:bg-surface border-[1px] border-black dark:border-transparent shadow-[0_1px_0_0_#000] dark:shadow-none px-2 py-1 rounded">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              {formatDateTime(reminder.scheduledAt)}
            </span>
            <span className="font-mono-label text-xs text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-primary text-[14px]">label</span>
              {reminder.channel.toUpperCase()}
            </span>
            <span className={`font-mono-label text-xs flex items-center gap-1 border-[1px] border-black dark:border-transparent shadow-[0_1px_0_0_#000] dark:shadow-none px-2 py-1 rounded bg-white dark:bg-surface ${STATUS_COLORS[reminder.status]}`}>
              {reminder.status.toUpperCase()}
            </span>
            {reminder.status === "snoozed" && reminder.snoozeUntil && (
              <span className="font-mono-label text-xs text-amber-500 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">snooze</span>
                Snoozed to {formatDateTime(reminder.snoozeUntil)}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 self-end md:self-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
        {reminder.status !== "sent" && (
          <button
            onClick={async () => {
              setSnoozing(true);
              try { await onSnooze(reminder.id); } finally { setSnoozing(false); }
            }}
            disabled={snoozing}
            title="Snooze 30 min"
            className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-amber-500 hover:bg-surface transition-colors disabled:opacity-50 border border-transparent hover:border-amber-500/30"
          >
            {snoozing ? (
              <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
            ) : (
              <span className="material-symbols-outlined text-[20px]">snooze</span>
            )}
          </button>
        )}
        <button
          onClick={async () => {
            setDeleting(true);
            try { await onDelete(reminder.id); } finally { setDeleting(false); }
          }}
          disabled={deleting}
          title="Delete"
          className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-surface transition-colors disabled:opacity-50 border border-transparent hover:border-error/30"
        >
          {deleting ? (
            <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
          ) : (
            <span className="material-symbols-outlined text-[20px]">delete</span>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const pendingCount = reminders.filter(r => r.status === "pending").length;

  return (
    <div className="flex-1 overflow-y-auto page-enter px-4 md:px-8 py-8 custom-scrollbar">
      <div className="max-w-container-max mx-auto flex flex-col gap-8 md:gap-12">
        
        {/* Header Area */}
        <div className="flex flex-row justify-between items-end gap-6 mb-2">
          <header className="flex flex-col gap-3">
            <h1 className="text-[28px] font-headline-md font-bold text-on-surface flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FAF5F0] dark:bg-surface-container flex items-center justify-center border-[2px] border-black dark:border-[#E8DCC8] shrink-0 shadow-[0_2px_0_0_#000] dark:shadow-none">
                <span className="material-symbols-outlined text-[#118AB2] dark:text-primary text-[20px]">notifications</span>
              </div>
              Reminder Protocol
            </h1>
            <p className="text-on-surface-variant font-body-lg">
              Manage proactive task notification channels.
            </p>
          </header>
        </div>

        {/* List Header */}
        <div className="flex justify-between items-end border-b border-outline-variant/30 pb-4">
          <h2 className="font-headline-sm text-xl font-bold text-on-surface">
            Active Registry
          </h2>
          <div className="font-mono-label text-xs tracking-wider uppercase text-on-surface-variant flex items-center gap-2">
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-[14px]">sync</span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            )}
            {reminders.length} Entries Online
          </div>
        </div>

        {/* Quick Add Module */}
        <AddReminderForm onSave={handleCreate} />

        {error && (
          <div className="bg-error-container/20 border border-error/50 rounded-2xl p-4 flex items-center justify-between text-error font-mono-label text-sm">
            <span>{error}</span>
            <button
              onClick={fetchReminders}
              className="border border-error/50 px-3 py-1 rounded hover:bg-error/10 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Reminder List */}
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="p-12 flex justify-center text-primary">
              <span className="material-symbols-outlined animate-spin text-[32px]">sync</span>
            </div>
          ) : reminders.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-on-surface-variant gap-4 border border-dashed border-outline-variant/30 rounded-[2rem]">
              <span className="material-symbols-outlined text-[48px] opacity-50">notifications_off</span>
              <span className="font-mono-label text-xs tracking-widest uppercase">No Active Reminders</span>
            </div>
          ) : (
            <div className="bg-white dark:bg-surface border-[3px] border-black dark:border-outline-variant/20 rounded-[32px] p-6 lg:p-8 shadow-[0_4px_0_0_#000] dark:shadow-sm flex flex-col gap-4">
              {reminders.map(r => (
                <ReminderCard
                  key={r.id}
                  reminder={r}
                  onSnooze={handleSnooze}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
