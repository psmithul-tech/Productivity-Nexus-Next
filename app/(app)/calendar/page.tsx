"use client";

import { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalendarEvent {
  id: number | string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  description?: string;
}

interface NewEvent {
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toISODate(d: Date) {
  return d.toISOString().split("T")[0];
}

function startOfMonth(year: number, month: number) {
  return new Date(year, month, 1);
}

function endOfMonth(year: number, month: number) {
  return new Date(year, month + 1, 0, 23, 59, 59);
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Add Event Modal ──────────────────────────────────────────────────────────

function AddEventModal({
  open,
  defaultDate,
  onClose,
  onSave,
}: {
  open: boolean;
  defaultDate: Date;
  onClose: () => void;
  onSave: (event: NewEvent) => Promise<void>;
}) {
  const defaultStart = () => {
    const d = new Date(defaultDate);
    d.setHours(9, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };
  const defaultEnd = () => {
    const d = new Date(defaultDate);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const [form, setForm] = useState<NewEvent>({
    title: "",
    startTime: defaultStart(),
    endTime: defaultEnd(),
    location: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setForm({
        title: "",
        startTime: defaultStart(),
        endTime: defaultEnd(),
        location: "",
        description: "",
      });
      setErr(null);
      setTimeout(() => firstRef.current?.focus(), 50);
    }
  }, [open, defaultDate]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setErr("Title is required"); return; }
    if (!form.startTime) { setErr("Start time is required"); return; }
    if (!form.endTime) { setErr("End time is required"); return; }
    setSaving(true);
    setErr(null);
    try {
      await onSave({
        ...form,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
      });
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card/90 p-6 backdrop-blur-xl shadow-2xl">
        <h2 className="mb-5 text-lg font-semibold text-foreground">New Event</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Title</label>
            <input
              ref={firstRef}
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Event title"
              className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Start Time</label>
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">End Time</label>
              <input
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Location <span className="opacity-50">(optional)</span>
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Conference room, Zoom link…"
              className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Description <span className="opacity-50">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Notes, agenda…"
              className="w-full resize-none rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          {err && <p className="text-xs text-red-400">{err}</p>}

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
              {saving ? "Saving…" : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(now);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  async function fetchEvents(y: number, m: number) {
    setLoading(true);
    setError(null);
    try {
      const from = startOfMonth(y, m).toISOString();
      const to = endOfMonth(y, m).toISOString();
      const res = await fetch(
        `/api/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : data.events ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents(year, month);
  }, [year, month]);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  async function handleCreate(event: NewEvent) {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(err.error ?? `HTTP ${res.status}`);
    }
    await fetchEvents(year, month);
  }

  async function handleDelete(id: number | string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setEvents(prev => prev.filter(e => e.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  // Build calendar grid
  const firstDay = startOfMonth(year, month).getDay(); // 0=Sun
  const totalDays = daysInMonth(year, month);
  const totalCells = Math.ceil((firstDay + totalDays) / 7) * 7;

  function eventsForDay(d: Date) {
    return events.filter(ev => isSameDay(new Date(ev.startTime), d));
  }

  const selectedEvents = eventsForDay(selectedDate);

  // Dot colors cycling
  const DOT_COLORS = [
    "bg-blue-400", "bg-purple-400", "bg-emerald-400",
    "bg-amber-400", "bg-pink-400", "bg-cyan-400",
  ];

  return (
    <>
      <AddEventModal
        open={showModal}
        defaultDate={selectedDate}
        onClose={() => setShowModal(false)}
        onSave={handleCreate}
      />

      <div className="min-h-screen bg-background px-4 py-8 sm:px-8">
        {/* ── Header ── */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Calendar</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/20 transition-all"
          >
            <span className="text-base leading-none">+</span> New Event
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-400">
            <span>{error}</span>
            <button
              onClick={() => fetchEvents(year, month)}
              className="rounded-lg border border-red-500/30 px-3 py-1 text-xs hover:bg-red-500/20"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* ── Calendar Grid ── */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card/50 p-4 backdrop-blur-xl sm:p-6">
            {/* Month nav */}
            <div className="mb-5 flex items-center justify-between">
              <button
                onClick={prevMonth}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
              >
                ‹
              </button>
              <h2 className="text-base font-semibold text-foreground">
                {MONTHS[month]} {year}
              </h2>
              <button
                onClick={nextMonth}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
              >
                ›
              </button>
            </div>

            {/* Day labels */}
            <div className="mb-2 grid grid-cols-7 gap-1">
              {DAYS.map(d => (
                <div key={d} className="py-1 text-center text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  {d}
                </div>
              ))}
            </div>

            {/* Loading overlay */}
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: totalCells }).map((_, i) => {
                  const dayNum = i - firstDay + 1;
                  const isCurrentMonth = dayNum >= 1 && dayNum <= totalDays;
                  const cellDate = new Date(year, month, dayNum);
                  const isToday = isCurrentMonth && isSameDay(cellDate, now);
                  const isSelected = isCurrentMonth && isSameDay(cellDate, selectedDate);
                  const dayEvents = isCurrentMonth ? eventsForDay(cellDate) : [];

                  return (
                    <button
                      key={i}
                      onClick={() => isCurrentMonth && setSelectedDate(cellDate)}
                      disabled={!isCurrentMonth}
                      className={`relative flex min-h-[52px] flex-col items-center rounded-xl p-1 pt-1.5 text-xs transition-all sm:min-h-[64px] ${
                        !isCurrentMonth
                          ? "opacity-0 pointer-events-none"
                          : isSelected
                          ? "border border-primary/50 bg-primary/15 text-primary"
                          : isToday
                          ? "border border-primary/20 bg-primary/5 text-foreground"
                          : "border border-transparent text-foreground hover:bg-white/5"
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                          isToday && !isSelected
                            ? "bg-primary text-primary-foreground"
                            : ""
                        }`}
                      >
                        {isCurrentMonth ? dayNum : ""}
                      </span>
                      {/* Event dots */}
                      {dayEvents.length > 0 && (
                        <div className="mt-1 flex flex-wrap justify-center gap-0.5">
                          {dayEvents.slice(0, 3).map((ev, idx) => (
                            <span
                              key={ev.id}
                              className={`h-1.5 w-1.5 rounded-full ${DOT_COLORS[idx % DOT_COLORS.length]}`}
                            />
                          ))}
                          {dayEvents.length > 3 && (
                            <span className="text-[8px] text-muted-foreground">+{dayEvents.length - 3}</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Day Panel ── */}
          <div className="rounded-2xl border border-border bg-card/50 p-4 backdrop-blur-xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {selectedDate.toLocaleDateString([], {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {selectedEvents.length} event{selectedEvents.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
                title="Add event"
              >
                +
              </button>
            </div>

            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="rounded-xl border border-border/30 bg-background/20 p-3 space-y-2">
                    <div className="h-3 w-3/4 rounded bg-white/10" />
                    <div className="h-3 w-1/2 rounded bg-white/10" />
                  </div>
                ))}
              </div>
            ) : selectedEvents.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
                <span className="text-3xl">📭</span>
                <p className="text-sm">No events this day</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-1 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs text-primary hover:bg-primary/20 transition-colors"
                >
                  Add event
                </button>
              </div>
            ) : (
              <ul className="space-y-3">
                {selectedEvents.map((ev, idx) => (
                  <li
                    key={ev.id}
                    className="group relative overflow-hidden rounded-xl border border-border/50 bg-background/30 p-3 transition-all hover:bg-background/50"
                  >
                    {/* Left accent bar */}
                    <div
                      className={`absolute left-0 top-0 h-full w-1 rounded-l-xl ${
                        DOT_COLORS[idx % DOT_COLORS.length]
                      }`}
                    />
                    <div className="pl-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground leading-snug">
                          {ev.title}
                        </p>
                        <button
                          onClick={() => handleDelete(ev.id)}
                          disabled={deletingId === ev.id}
                          className="flex-shrink-0 opacity-0 group-hover:opacity-100 flex h-5 w-5 items-center justify-center rounded border border-red-500/20 bg-red-500/10 text-[10px] text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
                        >
                          {deletingId === ev.id ? "…" : "✕"}
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatTime(ev.startTime)} – {formatTime(ev.endTime)}
                      </p>
                      {ev.location && (
                        <p className="mt-0.5 text-xs text-muted-foreground/70 truncate">
                          📍 {ev.location}
                        </p>
                      )}
                      {ev.description && (
                        <p className="mt-1.5 text-xs text-muted-foreground/60 line-clamp-2">
                          {ev.description}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
