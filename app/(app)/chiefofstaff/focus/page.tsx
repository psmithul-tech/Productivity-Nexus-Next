"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

type SessionPreset = { label: string; work: number; break: number };

const PRESETS: SessionPreset[] = [
  { label: "Sprint", work: 15, break: 3 },
  { label: "Pomodoro", work: 25, break: 5 },
  { label: "Deep Work", work: 50, break: 10 },
  { label: "Long Focus", work: 90, break: 15 },
];

type Task = { id: number; title: string; status: string };
type FocusSession = { id: number; durationMinutes: number; completedMinutes: number; status: string; startedAt: string; completedAt: string | null };

export default function FocusPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<SessionPreset>(PRESETS[1]);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [todaySessions, setTodaySessions] = useState<FocusSession[]>([]);
  const [showTaskSelector, setShowTaskSelector] = useState(false);
  
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
      
      const activeSession = data.find((s: FocusSession) => s.status === "active");
      if (activeSession && !isRunning) {
        // Retrieve local storage state if it exists
        const localStateStr = localStorage.getItem("nexus-focus-timer");
        let remainingSec = 0;
        let shouldRun = false;
        
        if (localStateStr) {
          const localState = JSON.parse(localStateStr);
          if (localState.sessionId === activeSession.id) {
            const elapsedSinceTick = localState.isRunning ? Math.floor((Date.now() - localState.lastTick) / 1000) : 0;
            remainingSec = localState.timeLeft - elapsedSinceTick;
            shouldRun = localState.isRunning;
          }
        }

        // Fallback to server time if local storage doesn't have it
        if (remainingSec === 0 && !localStateStr) {
          const elapsedSec = Math.floor((Date.now() - new Date(activeSession.startedAt).getTime()) / 1000);
          const totalSec = activeSession.durationMinutes * 60;
          remainingSec = totalSec - elapsedSec;
          shouldRun = true;
        }
        
        if (remainingSec > 0) {
          sessionIdRef.current = activeSession.id;
          setTimeLeft(remainingSec);
          
          const preset = PRESETS.find(p => p.work === activeSession.durationMinutes) || PRESETS[1];
          setSelectedPreset(preset);
          if (activeSession.taskId) setSelectedTaskId(activeSession.taskId);
          
          setIsRunning(shouldRun);
          setIsBreak(false);
          toast.success("Resumed active focus session.");
        } else if (remainingSec <= 0 && shouldRun) {
          // Timer finished while away, complete it
          await fetch(`/api/focus-sessions`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: activeSession.id, status: "completed", completedMinutes: activeSession.durationMinutes }),
          });
          setSessionsCompleted(s => s + 1);
          setIsBreak(true);
          const preset = PRESETS.find(p => p.work === activeSession.durationMinutes) || PRESETS[1];
          setSelectedPreset(preset);
          setTimeLeft(preset.break * 60);
          toast.success("Focus session completed while you were away! Time for a break.");
          
          const refetch = await fetch("/api/focus-sessions");
          if (refetch.ok) setTodaySessions(await refetch.json());
          localStorage.removeItem("nexus-focus-timer");
        }
      }
    }
  }

  // Timer tick
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          const newTime = t - 1;
          // Persist state to localStorage on every tick
          if (sessionIdRef.current) {
            localStorage.setItem("nexus-focus-timer", JSON.stringify({
              sessionId: sessionIdRef.current,
              timeLeft: newTime,
              isRunning: true,
              lastTick: Date.now()
            }));
          }
          return newTime;
        });
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleTimerComplete();
    } else if (!isRunning && sessionIdRef.current) {
      // Persist paused state
      localStorage.setItem("nexus-focus-timer", JSON.stringify({
        sessionId: sessionIdRef.current,
        timeLeft,
        isRunning: false,
        lastTick: Date.now()
      }));
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
      toast.success(`🎉 Focus session complete! Take a \${selectedPreset.break}min break.`);
      loadSessions();
    }
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const totalSeconds = isBreak ? selectedPreset.break * 60 : selectedPreset.work * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  
  // Progress Ring Calculation
  const circumference = 2 * Math.PI * 180;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  const todayMinutes = todaySessions.filter(s => s.status === "completed").reduce((a, s) => a + s.completedMinutes, 0);

  const selectedTaskObj = tasks.find(t => t.id === selectedTaskId);

  return (
    <div className="flex-1 w-full min-h-[calc(100vh-80px)] flex flex-col relative overflow-hidden bg-surface page-enter rounded-[32px]">
      {/* Ambient Background Glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[100px] pointer-events-none transition-colors duration-1000 \${isBreak ? 'bg-secondary-fixed/50' : isRunning ? 'bg-primary/40' : 'bg-surface-variant'}`}></div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 z-10 relative">
        {/* Context: Task Selector */}
        <div className="mb-12 w-full max-w-md relative">
          <div className="font-mono-label text-xs text-outline mb-2 uppercase tracking-widest text-center font-bold">Current Objective</div>
          <div 
            onClick={() => !isRunning && setShowTaskSelector(!showTaskSelector)}
            className={`bg-white dark:bg-surface-container p-4 rounded-xl flex items-center justify-between cursor-pointer transition-all border-[2px] border-black dark:border-transparent \${
              isRunning ? 'opacity-70 cursor-default ring-2 ring-primary' : 'shadow-[0_3px_0_0_#000] dark:shadow-sm hover:-translate-y-[2px] hover:shadow-[0_5px_0_0_#000] dark:hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>target</span>
              <span className="font-body-lg text-lg text-on-surface truncate font-semibold">
                {selectedTaskObj ? selectedTaskObj.title : "Select a task..."}
              </span>
            </div>
            {!isRunning && (
              <span className="material-symbols-outlined text-outline" style={{ fontVariationSettings: "'FILL' 0" }}>expand_more</span>
            )}
          </div>

          {/* Task Dropdown Menu */}
          {showTaskSelector && !isRunning && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-surface shadow-[0_4px_0_0_#000] dark:shadow-lg rounded-[24px] border-[3px] border-black dark:border-outline-variant/30 z-20 max-h-64 overflow-y-auto">
              <div 
                className="p-3 border-b border-outline-variant/30 font-body-md text-on-surface-variant hover:bg-surface-container cursor-pointer transition-colors"
                onClick={() => { setSelectedTaskId(null); setShowTaskSelector(false); }}
              >
                No specific task
              </div>
              {tasks.length === 0 ? (
                <div className="p-4 text-center font-body-md text-on-surface-variant opacity-50">No active tasks found.</div>
              ) : (
                tasks.map(t => (
                  <div 
                    key={t.id}
                    className="p-3 border-b border-outline-variant/30 font-body-md text-on-surface hover:bg-surface-container cursor-pointer transition-colors"
                    onClick={() => { setSelectedTaskId(t.id); setShowTaskSelector(false); }}
                  >
                    {t.title}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Core: Digital Timer & Progress Ring */}
        <div className="relative w-[320px] h-[320px] md:w-[400px] md:h-[400px] flex items-center justify-center mb-12">
          {/* SVG Ring */}
          <svg className="absolute inset-0 w-full h-full drop-shadow-md" height="400" viewBox="0 0 400 400" width="400">
            <circle cx="200" cy="200" fill="transparent" r="180" stroke="#ebe8e3" strokeWidth="8"></circle>
            <circle 
              className="transition-all duration-1000 ease-linear" 
              cx="200" cy="200" 
              fill="transparent" 
              r="180" 
              stroke={isBreak ? "#fe932c" : "#163428"} 
              strokeDasharray={circumference} 
              strokeDashoffset={strokeDashoffset} 
              strokeLinecap="round" 
              strokeWidth="12"
              style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
            ></circle>
          </svg>
          <div className="text-center z-10 flex flex-col items-center bg-white dark:bg-surface-container-low/50 w-[280px] h-[280px] md:w-[320px] md:h-[320px] rounded-full justify-center shadow-[0_4px_0_0_#000] dark:shadow-[inset_0_4px_20px_rgba(0,0,0,0.03)] border-[3px] border-black dark:border-transparent backdrop-blur-md">
            <div className={`font-display-lg text-[70px] md:text-[100px] font-bold tracking-tighter leading-none \${isBreak ? 'text-secondary' : 'text-primary'}`}>
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>
            <div className={`font-mono-label text-xs mt-4 uppercase tracking-[0.2em] font-bold \${isBreak ? 'text-secondary' : 'text-primary'}`}>
              {isBreak ? "Break Time" : selectedPreset.label}
            </div>
          </div>
        </div>

        {/* Controls: Play/Pause/Stop & Presets */}
        <div className="flex flex-col items-center gap-8">
          {/* Primary Actions */}
          <div className="flex items-center gap-6 bg-white dark:bg-surface-container p-2 rounded-full shadow-[0_3px_0_0_#000] dark:shadow-sm border-[3px] border-black dark:border-transparent">
            <button 
              onClick={pauseTimer}
              disabled={!isRunning}
              className="w-14 h-14 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>pause</span>
            </button>
            <button 
              onClick={startTimer}
              disabled={isRunning}
              className="w-20 h-20 rounded-full bg-[#06D6A0] dark:bg-primary text-black dark:text-on-primary flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 shadow-[0_3px_0_0_#000] dark:shadow-md border-[2px] border-black dark:border-transparent"
            >
              <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
            </button>
            <button 
              onClick={resetTimer}
              className="w-14 h-14 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>stop</span>
            </button>
          </div>

          {/* Presets */}
          <div className="flex items-center gap-3 flex-wrap justify-center mt-4">
            {PRESETS.map(p => (
              <button 
                key={p.label}
                onClick={() => selectPreset(p)}
                disabled={isRunning}
                className={`px-6 py-3 rounded-xl font-body-md font-semibold transition-all border-[2px] disabled:opacity-50 \${
                  selectedPreset.label === p.label 
                    ? 'bg-[#FFD166] dark:bg-primary-container text-black dark:text-on-primary-container border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-sm translate-y-[2px]' 
                    : 'bg-white dark:bg-surface-container text-black dark:text-on-surface-variant border-black dark:border-transparent hover:bg-gray-50 dark:hover:bg-surface-container-high shadow-[0_4px_0_0_#000] dark:shadow-none hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#000] dark:hover:shadow-none'
                }`}
              >
                {p.work}m
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer: Summary & XP */}
      <div className="w-full bg-white dark:bg-surface-container-low border-t-[3px] border-black dark:border-outline-variant/30 p-6 flex items-center justify-between z-10 rounded-b-[32px]">
        <div className="flex gap-8">
          <div className="flex flex-col">
            <span className="font-mono-label text-xs text-outline uppercase font-bold tracking-widest">Sessions Today</span>
            <span className="font-headline-md text-xl font-bold text-on-surface mt-2 flex items-center gap-2">
              {[...Array(Math.min(4, Math.max(sessionsCompleted, 1)))].map((_, i) => (
                <span 
                  key={i} 
                  className={`w-3 h-3 rounded-full \${
                    i < sessionsCompleted 
                      ? 'bg-primary shadow-sm' 
                      : 'border border-outline-variant'
                  }`}
                ></span>
              ))}
              <span className="ml-2">{sessionsCompleted}</span>
            </span>
          </div>
          <div className="flex flex-col hidden md:flex">
            <span className="font-mono-label text-xs text-outline uppercase font-bold tracking-widest">Total Focus Time</span>
            <span className="font-headline-md text-xl font-bold text-on-surface mt-2">
              {Math.floor(todayMinutes / 60)}h {todayMinutes % 60}m
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="font-mono-label text-xs text-outline uppercase font-bold tracking-widest">Daily XP</span>
          <div className="font-headline-md text-xl font-bold text-secondary mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
            +{sessionsCompleted * 150} XP
          </div>
        </div>
      </div>
    </div>
  );
}
