"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalendarEvent {
  id: number | string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  description?: string;
}

interface CalendarTask {
  id: number;
  title: string;
  dueDate: string;
  priority: string;
  status: string;
}

interface NewEvent {
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function getDurationText(startIso: string, endIso: string) {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const diffMinutes = Math.round((end - start) / 60000);
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const h = Math.floor(diffMinutes / 60);
  const m = diffMinutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ─── Add Event Modal ──────────────────────────────────────────────────────────

function EventModal({
  open,
  defaultDate,
  editEvent,
  onClose,
  onSave,
  onDelete
}: {
  open: boolean;
  defaultDate: Date;
  editEvent?: CalendarEvent | null;
  onClose: () => void;
  onSave: (event: any) => Promise<void>;
  onDelete?: (id: number | string) => void;
}) {
  const toLocalISOString = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const defaultStart = () => {
    const d = new Date(defaultDate);
    d.setHours(9, 0, 0, 0);
    return toLocalISOString(d);
  };
  const defaultEnd = () => {
    const d = new Date(defaultDate);
    d.setHours(10, 0, 0, 0);
    return toLocalISOString(d);
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
      if (editEvent) {
        setForm({
          title: editEvent.title,
          startTime: toLocalISOString(new Date(editEvent.startTime)),
          endTime: toLocalISOString(new Date(editEvent.endTime)),
          location: editEvent.location || "",
          description: editEvent.description || "",
        });
      } else {
        setForm({
          title: "",
          startTime: defaultStart(),
          endTime: defaultEnd(),
          location: "",
          description: "",
        });
      }
      setErr(null);
      setTimeout(() => firstRef.current?.focus(), 50);
    }
  }, [open, defaultDate, editEvent]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setErr("Title is required"); return; }
    if (!form.startTime) { setErr("Start time is required"); return; }
    if (!form.endTime) { setErr("End time is required"); return; }
    setSaving(true);
    setErr(null);
    try {
      await onSave({
        ...(editEvent ? { id: editEvent.id } : {}),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 page-enter">
      <div className="absolute inset-0 bg-black/20 dark:bg-surface shadow-sm rounded-3xl" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-surface rounded-[24px] p-8 shadow-[0_4px_0_0_#000] dark:shadow-lg border-[3px] border-black dark:border-outline-variant/30">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">{editEvent ? "Edit Event" : "New Event"}</h2>
          {editEvent && onDelete && (
            <button onClick={() => { onDelete(editEvent.id); onClose(); }} className="text-error hover:bg-surface-variant0 p-1.5 rounded transition-colors">
              <span className="material-symbols-outlined text-[20px]">delete</span>
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block font-mono-label text-mono-label text-on-surface-variant">Title</label>
            <input
              ref={firstRef}
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Event title"
              className="w-full rounded bg-surface-container-high border border-outline-variant/30 px-4 py-2 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-mono-label text-mono-label text-on-surface-variant">Start Time</label>
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full rounded bg-surface-container-high border border-outline-variant/30 px-3 py-2 font-body-sm text-body-sm text-on-surface focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono-label text-mono-label text-on-surface-variant">End Time</label>
              <input
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full rounded bg-surface-container-high border border-outline-variant/30 px-3 py-2 font-body-sm text-body-sm text-on-surface focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-mono-label text-mono-label text-on-surface-variant">
              Location <span className="opacity-50">(optional)</span>
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Conference room, Zoom link…"
              className="w-full rounded bg-surface-container-high border border-outline-variant/30 px-4 py-2 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="mb-1 block font-mono-label text-mono-label text-on-surface-variant">
              Description <span className="opacity-50">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Notes, agenda…"
              className="w-full resize-none rounded bg-surface-container-high border border-outline-variant/30 px-4 py-2 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          {err && <p className="font-mono-label text-mono-label text-error">{err}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded border border-outline-variant/50 bg-surface-container-low py-2 font-mono-label text-mono-label text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded bg-primary py-2 font-mono-label text-mono-label text-on-primary hover:bg-primary-dim transition-colors disabled:opacity-50"
            >
              {saving ? "SAVING…" : editEvent ? "SAVE CHANGES" : "CREATE EVENT"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [view, setView] = useState<"day" | "month">("day");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  async function fetchEventsData(date: Date, currentView: "day" | "month") {
    setLoading(true);
    setError(null);
    try {
      let from, to;
      if (currentView === "day") {
        const d = new Date(date);
        d.setHours(0,0,0,0);
        from = d.toISOString();
        d.setHours(23,59,59,999);
        to = d.toISOString();
      } else {
        const d = new Date(date.getFullYear(), date.getMonth(), 1);
        from = d.toISOString();
        const endD = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
        to = endD.toISOString();
      }
      
      const res = await fetch(`/api/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const evs = Array.isArray(data) ? data : data.events ?? [];
      
      // Sort by start time
      evs.sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      
      setEvents(evs);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEventsData(selectedDate, view);
    const id = setInterval(() => fetchEventsData(selectedDate, view), 30000);
    return () => clearInterval(id);
  }, [selectedDate, view]); // eslint-disable-line react-hooks/exhaustive-deps

  async function syncOldEvents() {
    setSyncing(true);
    toast.info("Syncing calendar events...");
    try {
      // Re-fetch all events for the current view
      await fetchEventsData(selectedDate, view);
      toast.success("Calendar sync complete!");
    } catch (e) {
      toast.error("Failed to sync events.");
    } finally {
      setSyncing(false);
    }
  }

  function prevPeriod() {
    setSelectedDate(d => {
      const nd = new Date(d);
      if (view === "day") {
        nd.setDate(nd.getDate() - 1);
      } else {
        nd.setMonth(nd.getMonth() - 1);
      }
      return nd;
    });
  }

  function nextPeriod() {
    setSelectedDate(d => {
      const nd = new Date(d);
      if (view === "day") {
        nd.setDate(nd.getDate() + 1);
      } else {
        nd.setMonth(nd.getMonth() + 1);
      }
      return nd;
    });
  }

  function goToToday() {
    setSelectedDate(new Date());
  }

  async function handleSave(event: any) {
    if (event.id) {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });
      if (!res.ok) throw new Error("Failed to update event");
    } else {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });
      if (!res.ok) throw new Error("Failed to create event");
    }
    await fetchEventsData(selectedDate, view);
  }

  async function handleDelete(id: number | string) {
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setEvents(prev => prev.filter(e => e.id !== id));
      toast.success("Event deleted");
    } catch {
      toast.error("Failed to delete event");
    }
  }

  const now = new Date();
  
  // Center active event logic
  useEffect(() => {
    if (view === "day" && !loading && containerRef.current) {
      const currentEl = document.getElementById("current-event");
      if (currentEl) {
        setTimeout(() => {
          currentEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    }
  }, [loading, view]);

  function getMonthDays(date: Date) {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const days = [];
    
    const startDay = start.getDay(); // 0 is Sunday
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= end.getDate(); i++) {
      days.push(new Date(date.getFullYear(), date.getMonth(), i));
    }
    return days;
  }

  return (
    <>
      <EventModal
        open={showModal}
        defaultDate={selectedDate}
        editEvent={editEvent}
        onClose={() => { setShowModal(false); setEditEvent(null); }}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      <div className="flex-1 flex flex-col h-full w-full bg-background relative page-enter max-w-container-max mx-auto">
        {/* Date Navigation Bar */}
        <div className="bg-white dark:bg-surface rounded-[32px] border-[3px] border-black dark:border-outline-variant/20 p-6 mx-4 mt-4 flex flex-col md:flex-row items-center justify-between shadow-[0_4px_0_0_#000] dark:shadow-sm z-20 relative gap-4">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <button onClick={prevPeriod} className="w-10 h-10 flex items-center justify-center rounded-xl border-[2px] border-black dark:border-outline-variant/30 hover:border-primary hover:text-primary bg-white dark:bg-surface-container-lowest transition-all text-on-surface-variant shadow-[0_2px_0_0_#000] dark:shadow-sm hover:translate-y-[2px] hover:shadow-[0_1px_0_0_#000] dark:hover:shadow-sm">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <span className="font-headline-sm text-xl text-on-surface min-w-[200px] text-center font-bold tracking-tight">
                {view === "day" 
                  ? selectedDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: selectedDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
                  : selectedDate.toLocaleDateString([], { month: 'long', year: 'numeric' })
                }
              </span>
              <button onClick={nextPeriod} className="w-10 h-10 flex items-center justify-center rounded-xl border-[2px] border-black dark:border-outline-variant/30 hover:border-primary hover:text-primary bg-white dark:bg-surface-container-lowest transition-all text-on-surface-variant shadow-[0_2px_0_0_#000] dark:shadow-sm hover:translate-y-[2px] hover:shadow-[0_1px_0_0_#000] dark:hover:shadow-sm">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
            <button onClick={goToToday} className="font-mono-label text-xs font-bold uppercase tracking-wider text-on-surface-variant border-[2px] border-black dark:border-outline-variant/30 rounded-xl px-4 py-2 hover:border-primary hover:text-primary bg-white dark:bg-surface-container-lowest transition-all shadow-[0_2px_0_0_#000] dark:shadow-sm hover:translate-y-[2px] hover:shadow-[0_1px_0_0_#000] dark:hover:shadow-sm">
              Today
            </button>
            <button 
              onClick={syncOldEvents} 
              disabled={syncing}
              className="font-mono-label text-xs font-bold uppercase tracking-wider text-on-surface-variant border-[2px] border-black dark:border-outline-variant/30 rounded-xl px-4 py-2 hover:border-primary hover:text-primary bg-white dark:bg-surface-container-lowest transition-all shadow-[0_2px_0_0_#000] dark:shadow-sm hover:translate-y-[2px] hover:shadow-[0_1px_0_0_#000] dark:hover:shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[16px] ${syncing ? 'animate-spin' : ''}`}>sync</span>
              Sync
            </button>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-end">
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-surface-container-low p-1.5 rounded-xl border-[2px] border-black dark:border-outline-variant/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] dark:shadow-inner">
              <button onClick={() => setView("day")} className={`px-5 py-2 rounded-lg font-mono-label text-xs font-bold uppercase tracking-widest transition-all ${view === "day" ? "bg-white dark:bg-primary text-black dark:text-on-primary border-[2px] border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-md" : "text-on-surface-variant hover:text-on-surface hover:bg-white/50"}`}>Day</button>
              <button onClick={() => setView("month")} className={`px-5 py-2 rounded-lg font-mono-label text-xs font-bold uppercase tracking-widest transition-all ${view === "month" ? "bg-white dark:bg-primary text-black dark:text-on-primary border-[2px] border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-md" : "text-on-surface-variant hover:text-on-surface hover:bg-white/50"}`}>Month</button>
            </div>
            <button 
              onClick={() => { setEditEvent(null); setShowModal(true); }}
              className="bg-[#EF476F] dark:bg-primary text-white dark:text-on-primary border-[2px] border-black dark:border-transparent hover:translate-y-[2px] rounded-xl px-6 py-3 font-mono-label text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-[0_4px_0_0_#000] dark:shadow-none hover:shadow-[0_2px_0_0_#000] dark:hover:shadow-none"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Event
            </button>
          </div>
        </div>

        {/* Calendar Views */}
        {view === "month" ? (
          <div className="p-4 md:p-8 flex-1 overflow-y-auto custom-scrollbar relative z-10">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2 md:gap-4 max-w-6xl mx-auto">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center font-mono-label text-xs font-bold uppercase tracking-widest text-outline-variant mb-2">{day}</div>
                ))}
                {getMonthDays(selectedDate).map((day, i) => {
                  if (!day) return <div key={i} className="min-h-[100px] md:min-h-[140px] rounded-[1.5rem] bg-surface-container-lowest/30 border border-outline-variant/10"></div>;
                  
                  const isToday = isSameDay(day, now);
                  const dayEvents = events.filter(e => isSameDay(new Date(e.startTime), day));
                  
                  return (
                    <div 
                      key={i} 
                      onClick={() => { setSelectedDate(day); setView("day"); }}
                      className={`min-h-[100px] md:min-h-[140px] p-2 md:p-3 rounded-[1.5rem] border-[2px] cursor-pointer transition-all hover:-translate-y-1 flex flex-col bg-white dark:bg-surface-container-lowest ${isToday ? 'border-primary/50 bg-[#F0F4F8] dark:bg-primary/5 shadow-[0_2px_0_0_#000] dark:shadow-md' : 'border-black dark:border-outline-variant/20 hover:border-black shadow-[0_2px_0_0_#000] dark:shadow-sm'}`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm mb-2 shrink-0 ${isToday ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant bg-surface-container-high/50'}`}>
                        {day.getDate()}
                      </div>
                      <div className="space-y-1.5 flex-1 overflow-hidden">
                        {dayEvents.slice(0, 3).map(ev => (
                          <div key={ev.id} className="text-[10px] md:text-xs truncate px-2 py-1.5 rounded-lg bg-surface border border-outline-variant/10 text-on-surface font-medium shadow-sm flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                            {formatTime(ev.startTime)} - {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-[10px] md:text-xs text-center text-primary font-bold bg-primary/10 rounded-lg py-1 mt-1 border border-primary/20">+{dayEvents.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-lg py-8 relative z-10 custom-scrollbar" ref={containerRef}>
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-50">
                <span className="material-symbols-outlined text-4xl mb-4 text-on-surface-variant">event_available</span>
                <p className="font-mono-label text-mono-label text-on-surface-variant">No events scheduled for this day.</p>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto relative pl-0 md:pl-8 mt-4">
                {/* Center Line */}
                <div className="absolute left-[7.5rem] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-outline-variant/50 to-transparent hidden md:block" />

                {events.map((ev, index) => {
                  const start = new Date(ev.startTime);
                  const end = new Date(ev.endTime);
                  const isPast = end < now;
                  const isCurrent = start <= now && end >= now;
                  
                  return (
                    <div 
                      key={ev.id} 
                      id={isCurrent ? "current-event" : undefined}
                      className={"relative flex flex-col md:flex-row gap-6 mb-12 group transition-opacity " + (isPast && !isSameDay(selectedDate, now) === false ? 'opacity-60 hover:opacity-100 grayscale' : '')}
                    >
                      <div className="md:w-24 flex-shrink-0 text-right pt-2 relative">
                        {isCurrent && (
                          <div className="absolute -right-4 top-3 w-2 h-2 bg-primary rounded-full animate-pulse shadow-sm md:hidden"></div>
                        )}
                        <span className={"font-data-metric text-xl block tracking-tight " + (isCurrent ? 'text-primary font-bold' : 'text-on-surface-variant')}>
                          {formatTime(ev.startTime)}
                        </span>
                        <span className={"font-mono-label text-[10px] font-bold uppercase tracking-widest block mt-1 " + (isCurrent ? 'text-primary/80' : 'text-outline')}>
                          {getDurationText(ev.startTime, ev.endTime)}
                        </span>
                      </div>

                      {/* Timeline Node */}
                      {isCurrent ? (
                        <div className="hidden md:flex absolute left-[7.5rem] -translate-x-1/2 w-5 h-5 rounded-full border-[5px] border-primary bg-background shadow-md z-10 mt-3">
                          <div className="w-2 h-2 bg-primary rounded-full m-auto animate-pulse"></div>
                        </div>
                      ) : (
                        <div className="hidden md:flex absolute left-[7.5rem] -translate-x-1/2 w-4 h-4 rounded-full border-2 border-outline-variant bg-surface-container-lowest z-10 mt-3 group-hover:border-primary group-hover:scale-125 transition-all shadow-sm"></div>
                      )}

                      {/* Event Card */}
                      <div 
                        onClick={() => { setEditEvent(ev); setShowModal(true); }}
                        className={"flex-1 rounded-[2rem] p-6 sm:p-8 cursor-pointer relative overflow-hidden transition-all shadow-[0_3px_0_0_#000] dark:shadow-sm hover:translate-y-[2px] hover:shadow-[0_1px_0_0_#000] dark:hover:shadow-md border-[3px] bg-white dark:bg-surface-container-lowest " + (
                          isCurrent 
                            ? 'border-black dark:border-primary' 
                            : 'border-black dark:border-outline-variant/20 hover:border-black'
                        )}
                      >
                        {isCurrent && (
                          <div className="absolute left-0 top-0 bottom-0 w-2 bg-primary rounded-l-[2rem]"></div>
                        )}
                        {!isCurrent && (
                          <div className="absolute left-0 top-0 bottom-0 w-2 bg-transparent group-hover:bg-primary/50 transition-colors rounded-l-[2rem]"></div>
                        )}
                        
                        <div className="flex justify-between items-start mb-3">
                          <h3 className={"font-headline-sm text-2xl " + (isCurrent ? 'text-on-surface font-bold tracking-tight' : 'text-on-surface font-bold')}>
                            {ev.title}
                          </h3>
                          <span className={"material-symbols-outlined text-[28px] " + (isCurrent ? 'text-primary' : 'text-outline')}>
                            event
                          </span>
                        </div>
                        
                        {ev.description && (
                          <p className="font-body-md text-base text-on-surface-variant mb-6 line-clamp-2 leading-relaxed">
                            {ev.description}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-3">
                          {ev.location && (
                            <div className={"flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono-label text-xs font-bold border " + (isCurrent ? 'border-primary/30 bg-primary/10 text-primary' : 'border-outline-variant/30 bg-surface-container-high text-on-surface-variant')}>
                              <span className="material-symbols-outlined text-[16px]">location_on</span>
                              {ev.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
