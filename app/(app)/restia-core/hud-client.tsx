"use client";

import { useEffect, useState, useRef } from "react";
import { Cpu, Activity, Database, Shield, Zap, Wifi, Send, Loader2, User, Bot, Terminal, Code } from "lucide-react";
import { useRestia } from "@/components/restia-context";

export function RestiaHudClient({ initialData }: { initialData: any }) {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [sysData, setSysData] = useState(initialData);
  const [history, setHistory] = useState<number[]>(Array(30).fill(0));
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[SYS] Restia Monitor Initialized",
    "[SYS] Awaiting health probe...",
  ]);
  
  const { messages, sendMessage, input, setInput, streaming, isSpeaking } = useRestia();
  const bottomRef = useRef<HTMLDivElement>(null);
  const termBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    termBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLogs]);

  useEffect(() => {
    const int = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour12: false }));
      setDate(now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }));
    }, 1000);
    return () => clearInterval(int);
  }, []);

  // Poll for real data every 4 seconds to match monitor.js
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const start = Date.now();
        const res = await fetch("/api/health");
        if (res.ok) {
          const data = await res.json();
          const latency = Date.now() - start;
          setSysData((prev: any) => ({
            ...prev,
            uptime: data.uptime,
            stats: data.stats,
            integrations: data.integrations,
            dbLatencyMs: data.dbLatencyMs,
            mem: data.mem || prev.mem,
          }));
          
          setHistory(prev => {
            const next = [...prev, latency];
            if (next.length > 30) next.shift();
            return next;
          });

          setTerminalLogs(prev => {
            const next = [...prev, `[NET] Probe 200 OK - Latency: ${latency}ms - DB: ${data.dbLatencyMs}ms`];
            if (next.length > 50) next.shift();
            return next;
          });
        }
      } catch (e: any) {
        setTerminalLogs(prev => {
          const next = [...prev, `[ERR] Probe Failed: ${e.message}`];
          if (next.length > 50) next.shift();
          return next;
        });
      }
    }, 4000);
    return () => clearInterval(poll);
  }, []);

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return `${h}h ${m}m ${sec}s`;
  };

  const formatBytes = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(1) + " MB";
  };

  return (
    <div className="fixed top-0 bottom-0 left-0 right-0 md:left-[260px] bg-background overflow-hidden text-primary font-mono-label selection:bg-primary/30 flex flex-col z-[50]">
      <style>{`
        .hud-grid {
          background-image: 
            linear-gradient(to right, rgba(0, 240, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 240, 255, 0.05) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        
        .spin-slow { animation: spin 30s linear infinite; }
        .spin-slow-reverse { animation: spin-reverse 25s linear infinite; }
        .spin-fast { animation: spin 10s linear infinite; }
        
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes spin-reverse { 100% { transform: rotate(-360deg); } }
        
        .glow-text { text-shadow: 0 0 10px rgba(0, 240, 255, 0.7); }
        .glow-box { box-shadow: 0 0 15px rgba(0, 240, 255, 0.2), inset 0 0 20px rgba(0, 240, 255, 0.05); }
        .glow-border { box-shadow: 0 0 10px rgba(0, 240, 255, 0.5); }
        
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 240, 255, 0.3); border-radius: 9999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 240, 255, 0.6); }

        .spark-bar {
          transition: height 0.3s ease;
        }

        @keyframes wave-bar {
          0%, 100% { transform: scaleY(0.2); }
          50% { transform: scaleY(1); }
        }
        .animate-wave {
          animation: wave-bar 0.8s ease-in-out infinite;
          transform-origin: bottom;
        }
      `}</style>

      {/* Grid Background */}
      <div className="absolute inset-0 hud-grid opacity-30 pointer-events-none" />
      
      {/* HUD Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none z-0" />

      {/* Top Header */}
      <header className="relative z-10 flex justify-between items-start p-6 border-b border-primary/10 bg-background/80 backdrop-blur-md">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary animate-pulse " />
            <h1 className="text-2xl font-data-metric font-bold tracking-widest glow-text uppercase">Restia Core</h1>
          </div>
          <div className="text-xs tracking-widest text-primary-dim uppercase ml-7 flex items-center gap-2">
            <span>System Online</span>
            <span className="w-2 h-2 rounded-full bg-primary glow-border animate-pulse" />
          </div>
        </div>

        {/* Top middle clutter */}
        <div className="hidden lg:flex items-center gap-8 opacity-60">
           <div className="flex flex-col text-[9px] tracking-widest">
             <span className="text-primary-dim">LAT</span>
             <span>{sysData.dbLatencyMs}ms</span>
           </div>
           <div className="flex flex-col text-[9px] tracking-widest">
             <span className="text-primary-dim">MEM</span>
             <span>{sysData.mem?.rss ? formatBytes(sysData.mem.rss) : '0 MB'}</span>
           </div>
           <div className="flex flex-col text-[9px] tracking-widest">
             <span className="text-primary-dim">UPTIME</span>
             <span>{formatUptime(sysData.uptime)}</span>
           </div>
           <div className="flex gap-1 h-6 items-end">
              {history.slice(-10).map((v, i) => (
                 <div key={i} className="w-1 bg-primary/60 spark-bar" style={{ height: Math.max(10, Math.min(100, (v / 200) * 100)) + '%' }} />
              ))}
           </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="text-3xl font-data-metric font-light tracking-widest glow-text">{time || "00:00:00"}</div>
          <div className="text-xs tracking-widest text-primary-dim uppercase">{date || "AWAITING SYNC"}</div>
        </div>
      </header>

      {/* Main Interface Content */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row p-6 gap-6 overflow-hidden">
        
        {/* Left Panel: Real Server Metrics */}
        <div className="w-full lg:w-72 flex flex-col gap-6 shrink-0 overflow-y-auto custom-scrollbar pr-2">
          
          <div className="glow-box rounded-none border-l-2 border-primary p-4 bg-gradient-to-r from-primary/10 to-transparent">
            <h2 className="text-[10px] tracking-widest uppercase text-primary-dim mb-4 flex items-center gap-2">
              <Cpu className="w-3 h-3" /> Core Metrics
            </h2>
            <div className="flex flex-col gap-3">
              <div>
                <div className="flex justify-between text-[10px] mb-1 opacity-80">
                  <span>Server Uptime</span>
                  <span className="text-emerald-400">{formatUptime(sysData.uptime)}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1 opacity-80">
                  <span>RSS Memory</span>
                  <span>{sysData.mem?.rss ? formatBytes(sysData.mem.rss) : '0 MB'}</span>
                </div>
                <div className="h-1 w-full bg-primary/20 overflow-hidden">
                  <div className="h-full bg-primary glow-border" style={{ width: `${Math.min(100, ((sysData.mem?.rss || 0) / 1024 / 1024 / 1024) * 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1 opacity-80">
                  <span>Heap Used</span>
                  <span>{sysData.mem?.heapUsed ? formatBytes(sysData.mem.heapUsed) : '0 MB'}</span>
                </div>
                <div className="h-1 w-full bg-primary/20 overflow-hidden">
                  <div className="h-full bg-primary glow-border" style={{ width: `${Math.min(100, ((sysData.mem?.heapUsed || 0) / (sysData.mem?.heapTotal || 1)) * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="glow-box rounded-none border-l-2 border-primary p-4 bg-gradient-to-r from-primary/10 to-transparent">
             <h2 className="text-[10px] tracking-widest uppercase text-primary-dim mb-3 flex items-center gap-2">
              <Database className="w-3 h-3" /> Database Link
            </h2>
            <div className="text-[10px] space-y-2 text-primary/80 font-bold">
              <div className="flex justify-between">
                <span>Latency (Ping)</span>
                <span className={sysData.dbLatencyMs < 100 ? "text-emerald-400" : "text-amber-400"}>
                  {sysData.dbLatencyMs}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span>Connection</span>
                <span className="text-emerald-400">SECURE_ACTIVE</span>
              </div>
            </div>
          </div>

          <div className="glow-box rounded-none border-l-2 border-primary p-4 bg-gradient-to-r from-primary/10 to-transparent">
             <h2 className="text-[10px] tracking-widest uppercase text-primary-dim mb-3 flex items-center gap-2">
              <Activity className="w-3 h-3" /> User Operations
            </h2>
            <div className="text-[10px] space-y-2 text-primary-dim">
              <div className="flex justify-between">
                <span>Active Tasks</span>
                <span className="text-on-surface glow-text">{sysData.stats.activeTasks}</span>
              </div>
              <div className="flex justify-between">
                <span>Completed Tasks</span>
                <span className="text-emerald-400 glow-text">{sysData.stats.completedTasks}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Events</span>
                <span className="text-on-surface glow-text">{sysData.stats.totalEvents}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending Reminders</span>
                <span className="text-amber-400 glow-text">{sysData.stats.pendingReminders}</span>
              </div>
            </div>
          </div>

          <div className="glow-box rounded-none border-l-2 border-primary p-4 bg-gradient-to-r from-primary/10 to-transparent">
             <h2 className="text-[10px] tracking-widest uppercase text-primary-dim mb-3 flex items-center gap-2">
              <Code className="w-3 h-3" /> Active Threads
            </h2>
            <div className="text-[10px] space-y-2 text-primary/80">
              <div className="flex justify-between items-center">
                <span>Core.Watcher</span>
                <span className="text-emerald-400">0x8F9A</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Nexus.Sync</span>
                <span className="text-emerald-400">0x1B2C</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Mem.Allocator</span>
                <span className="text-emerald-400">0x4D3E</span>
              </div>
            </div>
          </div>
          
          {/* Aesthetic data block */}
          <div className="opacity-30 p-2 text-[8px] leading-relaxed break-all">
            4E 45 58 55 53 20 4F 50 45 52 41 54 49 56 45 20 49 4E 54 45 52 46 41 43 45<br/>
            00 00 00 01 00 02 00 03 00 04 00 05 00 06 00 07<br/>
            53 59 53 54 45 4D 20 41 43 54 49 56 45 20 2D 20 4E 4F 20 45 52 52 4F 52 53
          </div>

        </div>

        {/* Center: Circular Rings + Transparent Inline Chat */}
        <div className="relative flex-1 flex items-center justify-center min-h-[400px]">
          
          {/* Sci-Fi Rings - Larger and deeper */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 mix-blend-screen">
            <div className="absolute w-[600px] h-[600px] rounded-full border-[1px] border-primary/20 border-t-primary border-l-primary/50 spin-slow" />
            <div className="absolute w-[500px] h-[500px] rounded-full border-[2px] border-dashed border-primary/30 spin-slow-reverse" />
            <div className="absolute w-[400px] h-[400px] rounded-full border-[1px] border-primary/10 border-b-primary/80 spin-fast" />
            
            {/* Crosshairs */}
            <div className="absolute w-[800px] h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <div className="absolute h-[800px] w-[1px] bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
            
            <div className="absolute w-[100px] h-[100px] rounded-full border border-primary/60 flex items-center justify-center glow-box">
               <div className="w-4 h-4 bg-primary rounded-full animate-ping opacity-50" />
            </div>
          </div>

          {/* The Chat Console - completely transparent, floating text */}
          <div className="relative z-20 w-full max-w-2xl h-[500px] flex flex-col bg-background/40 backdrop-blur-sm border border-primary/20">
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-primary/20 bg-primary/10">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-bold tracking-[0.3em] text-primary">NEURAL_LINK_ACTIVE</span>
              </div>
              {/* Voice Waveform */}
              <div className="flex items-end gap-[2px] h-4">
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-1 bg-primary rounded-t-sm transition-all duration-300 ${isSpeaking ? 'animate-wave' : 'opacity-30'}`}
                    style={{ 
                      height: isSpeaking ? '100%' : '20%',
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: `${0.6 + (i % 3) * 0.2}s`
                    }} 
                  />
                ))}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
                  <p className="text-xs tracking-widest uppercase animate-pulse">Awaiting input stream...</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  if (msg.toolCall) {
                    return (
                      <div key={i} className="flex justify-start">
                        <div className="flex items-center gap-2 border-l-2 border-emerald-500 bg-emerald-500/5 px-3 py-1 text-[10px] text-emerald-400 tracking-wider">
                          <span>[SYS_OP]</span>
                          <span>
                            {msg.toolCall.type === "task" && `TASK_CREATED: ${msg.toolCall.data.title}`}
                            {msg.toolCall.type === "tasksBatch" && `BATCH_CREATED: ${msg.toolCall.data.tasks.length} TASKS`}
                            {msg.toolCall.type === "event" && `EVENT_SCHEDULED: ${msg.toolCall.data.title}`}
                            {msg.toolCall.type === "reminder" && `REMINDER_SET: TASK #${msg.toolCall.data.taskId}`}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  if (!msg.content && !msg.streaming) return null;
                  return (
                    <div key={i} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                      <div className={`mt-1 shrink-0 ${msg.role === "user" ? "text-primary" : "text-primary-dim"}`}>
                        {msg.role === "user" ? ">" : "<"}
                      </div>
                      <div className={`text-xs leading-relaxed whitespace-pre-wrap tracking-wide ${msg.role === "user" ? "text-primary" : "text-on-surface"}`}>
                        {msg.content || (msg.streaming && <span className="opacity-60 flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Processing...</span>)}
                        {msg.streaming && msg.content && <span className="inline-block w-2 h-3 ml-1 bg-primary animate-pulse align-middle" />}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-primary/20 bg-primary/5">
              <form 
                onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
                className="flex gap-2 relative"
              >
                <div className="flex items-center pl-2 text-primary font-bold">&gt;</div>
                <input
                  autoFocus
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={streaming ? "AWAITING RESPONSE..." : "COMMAND..."}
                  disabled={streaming}
                  className="flex-1 px-3 py-2 bg-transparent text-primary placeholder:text-primary/30 focus:outline-none text-xs tracking-widest disabled:opacity-50 transition-all font-mono-label"
                />
              </form>
            </div>
            
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-primary" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-primary" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-primary" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-primary" />
          </div>

        </div>

        {/* Right Panel: Integrations & Live Monitor Terminal */}
        <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0 z-20">
          
          <div className="glow-box rounded-none border-r-2 border-primary p-4 bg-gradient-to-l from-primary/10 to-transparent">
             <h2 className="text-[10px] tracking-widest uppercase text-primary-dim mb-3 flex items-center gap-2">
              <Wifi className="w-3 h-3" /> External Integrations
            </h2>
            <div className="text-[10px] space-y-2 font-bold">
              <div className="flex justify-between">
                <span className="text-primary/80">Telegram Webhook</span>
                <span className={sysData.integrations?.telegram ? "text-emerald-400" : "text-amber-400"}>
                  {sysData.integrations?.telegram ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary/80">Discord Webhook</span>
                <span className={sysData.integrations?.discord ? "text-emerald-400" : "text-amber-400"}>
                  {sysData.integrations?.discord ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary/80">Cron Hourly</span>
                <span className={sysData.integrations?.hourlyUpdates ? "text-emerald-400" : "text-amber-400"}>
                  {sysData.integrations?.hourlyUpdates ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
            </div>
          </div>

          <div className="glow-box rounded-none border-r-2 border-primary p-4 bg-gradient-to-l from-primary/10 to-transparent">
             <h2 className="text-[10px] tracking-widest uppercase text-primary-dim mb-3 flex items-center gap-2">
              <Activity className="w-3 h-3" /> Network Sparkline
            </h2>
            <div className="flex items-end gap-[2px] h-12 w-full mt-4">
              {history.map((val, i) => {
                const percent = Math.max(5, Math.min(100, (val / 300) * 100));
                const color = val > 200 ? "bg-amber-400" : val > 100 ? "bg-emerald-400" : "bg-primary";
                return (
                  <div key={i} className={`flex-1 spark-bar ${color}`} style={{ height: `${percent}%` }} />
                );
              })}
            </div>
            <div className="flex justify-between text-[8px] text-primary-dim mt-1 uppercase">
              <span>-120s</span>
              <span>Now</span>
            </div>
          </div>

          {/* Geek Facts / System Lore Panel */}
          <div className="glow-box rounded-none border-r-2 border-primary p-4 bg-gradient-to-l from-primary/10 to-transparent">
             <h2 className="text-[10px] tracking-widest uppercase text-primary-dim mb-3 flex items-center gap-2">
              <Bot className="w-3 h-3" /> System Lore
            </h2>
            <div className="text-[9px] text-primary-dim leading-relaxed">
              <p className="mb-2">» Over 90% of the world's data was generated in the last 2 years.</p>
              <p className="mb-2">» The Apollo 11 guidance computer had less processing power than a USB-C charger.</p>
              <p>» Restia JARVIS Core operates at sub-100ms latency for NLP parsing.</p>
            </div>
          </div>

          {/* Monitor Terminal */}
          <div className="flex-1 min-h-[250px] glow-box rounded-none border border-primary/30 bg-black p-3 flex flex-col relative">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-primary/20">
              <Terminal className="w-3 h-3 text-primary" />
              <span className="text-[9px] tracking-widest text-primary uppercase">Monitor.js STDOUT</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 text-[9px] leading-relaxed">
              {terminalLogs.map((log, i) => (
                <div key={i} className={
                  log.includes("[ERR]") ? "text-red-400" : 
                  log.includes("200 OK") ? "text-emerald-400" : 
                  "text-primary/70"
                }>
                  {log}
                </div>
              ))}
              <div ref={termBottomRef} />
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
