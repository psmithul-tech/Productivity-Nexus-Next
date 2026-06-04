"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, CheckCircle2, Timer, Target, Flame, Coffee } from "lucide-react";
import { toast } from "sonner";

type SessionPreset = { label: string; work: number; break: number; icon: React.ReactNode };

const PRESETS: SessionPreset[] = [
  { label: "Pomodoro", work: 25, break: 5, icon: <Timer className="h-5 w-5" /> },
  { label: "Deep Work", work: 50, break: 10, icon: <Target className="h-5 w-5" /> },
  { label: "Sprint", work: 15, break: 3, icon: <Flame className="h-5 w-5" /> },
  { label: "Long Focus", work: 90, break: 15, icon: <Coffee className="h-5 w-5" /> },
];

type Task = { id: number; title: string; status: string };
type FocusSession = { id: number; durationMinutes: number; completedMinutes: number; status: string; startedAt: string; completedAt: string | null };

export default function FocusPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<SessionPreset>(PRESETS[0]);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [todaySessions, setTodaySessions] = useState<FocusSession[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<number | null>(null);

  // Load tasks and sessions
  useEffect(() => {
    fetch("/api/tasks?status=active").then(r => r.ok ? r.json() : []).then(data => {
      setTasks(Array.isArray(data) ? data.filter((t: Task) => t.status === "active") : []);
    });
    loadSessions();
  }, []);

  async function loadSessions() {
    const res = await fetch("/api/focus-sessions");
    if (res.ok) {
      const data = await res.json();
      setTodaySessions(data);
      setSessionsCompleted(data.filter((s: FocusSession) => s.status === "completed").length);
    }
  }

  // Timer tick
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, timeLeft]);

  function selectPreset(preset: SessionPreset) {
    if (isRunning) return;
    setSelectedPreset(preset);
    setTimeLeft(preset.work * 60);
    setIsBreak(false);
  }

  async function startTimer() {
    setIsRunning(true);
    if (!isBreak && !sessionIdRef.current) {
      try {
        const res = await fetch("/api/focus-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId: selectedTaskId,
            durationMinutes: selectedPreset.work,
          }),
        });
        if (res.ok) {
          const session = await res.json();
          sessionIdRef.current = session.id;
        }
      } catch {}
    }
  }

  function pauseTimer() {
    setIsRunning(false);
  }

  function resetTimer() {
    setIsRunning(false);
    setTimeLeft(selectedPreset.work * 60);
    setIsBreak(false);
    sessionIdRef.current = null;
  }

  async function handleTimerComplete() {
    setIsRunning(false);
    if (isBreak) {
      // Break over, start next work session
      setIsBreak(false);
      setTimeLeft(selectedPreset.work * 60);
      toast.success("Break's over! Ready for another round?");
    } else {
      // Work session complete
      if (sessionIdRef.current) {
        await fetch(`/api/focus-sessions`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: sessionIdRef.current, status: "completed", completedMinutes: selectedPreset.work }),
        });
        sessionIdRef.current = null;
      }
      setSessionsCompleted(s => s + 1);
      setIsBreak(true);
      setTimeLeft(selectedPreset.break * 60);
      toast.success(`🎉 Focus session complete! Take a ${selectedPreset.break}min break.`);
      loadSessions();
    }
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const totalSeconds = isBreak ? selectedPreset.break * 60 : selectedPreset.work * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const circumference = 2 * Math.PI * 140;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const todayMinutes = todaySessions.filter(s => s.status === "completed").reduce((a, s) => a + s.completedMinutes, 0);

  return (
    <div className="relative min-h-screen pb-12 w-full overflow-hidden font-sans">
      {/* Ambient Glows */}
      <div className={`fixed top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full blur-[150px] opacity-50 mix-blend-screen pointer-events-none transition-colors duration-1000 ${isBreak ? "bg-green-600/20" : isRunning ? "bg-red-600/20" : "bg-primary/10"}`} />
      <div className="fixed bottom-[-10%] right-[-10%] h-[700px] w-[700px] rounded-full bg-blue-600/10 blur-[150px] opacity-40 mix-blend-screen pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Focus Timer</h1>
          <p className="text-white/40 text-sm">Deep work sessions with Pomodoro technique</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Timer */}
          <div className="lg:col-span-2 flex flex-col items-center gap-8">
            {/* Preset selector */}
            <div className="flex gap-2 flex-wrap justify-center">
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => selectPreset(p)}
                  disabled={isRunning}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    selectedPreset.label === p.label
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-white/5 text-white/50 border border-white/5 hover:bg-white/10 hover:text-white/80 disabled:opacity-50"
                  }`}
                >
                  {p.icon}
                  <span>{p.label}</span>
                  <span className="text-xs opacity-60">{p.work}m</span>
                </button>
              ))}
            </div>

            {/* Timer ring */}
            <div className="relative flex items-center justify-center">
              <svg width="320" height="320" className="transform -rotate-90">
                <circle cx="160" cy="160" r="140" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" />
                <circle
                  cx="160" cy="160" r="140"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className={`transition-all duration-1000 ease-linear ${isBreak ? "text-green-500" : isRunning ? "text-red-400" : "text-primary"}`}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className={`text-7xl font-extrabold tabular-nums tracking-tight ${isBreak ? "text-green-400" : "text-white"}`}>
                  {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                </span>
                <span className={`text-xs font-bold uppercase tracking-widest mt-2 ${isBreak ? "text-green-400/60" : "text-white/40"}`}>
                  {isBreak ? "Break Time" : isRunning ? "Focusing…" : "Ready"}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              {!isRunning ? (
                <button
                  onClick={startTimer}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-primary text-white font-bold text-lg shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all"
                >
                  <Play className="h-5 w-5" fill="currentColor" /> Start
                </button>
              ) : (
                <button
                  onClick={pauseTimer}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white/10 text-white font-bold text-lg hover:bg-white/20 transition-all"
                >
                  <Pause className="h-5 w-5" fill="currentColor" /> Pause
                </button>
              )}
              <button
                onClick={resetTimer}
                className="p-3.5 rounded-2xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                title="Reset"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
            </div>

            {/* Task selector */}
            <div className="w-full max-w-sm">
              <select
                value={selectedTaskId ?? ""}
                onChange={e => setSelectedTaskId(e.target.value ? Number(e.target.value) : null)}
                disabled={isRunning}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/80 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
              >
                <option value="">No task linked</option>
                {tasks.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-4">
            {/* Today's Stats */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4">Today</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">Sessions</span>
                  <span className="text-2xl font-extrabold text-white">{sessionsCompleted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">Focus Time</span>
                  <span className="text-2xl font-extrabold text-primary">
                    {Math.floor(todayMinutes / 60)}h {todayMinutes % 60}m
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">Streak</span>
                  <span className="text-2xl font-extrabold text-orange-400">
                    {sessionsCompleted > 0 ? "🔥" : "—"} {sessionsCompleted}
                  </span>
                </div>
              </div>
            </div>

            {/* Session History */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4">Recent Sessions</h3>
              {todaySessions.length === 0 ? (
                <p className="text-sm text-white/30 text-center py-4">No sessions yet today</p>
              ) : (
                <div className="space-y-2">
                  {todaySessions.slice(0, 5).map(s => (
                    <div key={s.id} className="flex items-center gap-3 py-2">
                      <CheckCircle2 className={`h-4 w-4 shrink-0 ${s.status === "completed" ? "text-green-500" : "text-white/20"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/60">{s.completedMinutes}min focus</p>
                        <p className="text-[10px] text-white/30">
                          {new Date(s.startedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
