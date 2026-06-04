"use client";

import { useEffect, useRef, useState } from "react";
import { useRestia } from "./restia-context";
import { Send, Sparkles, Loader2, User, Bot, X, Anchor, Navigation } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const RANDOM_THOUGHTS = [
  "You're doing great today!",
  "Don't forget to stay hydrated!",
  "I'm right here if you need me.",
  "Wow, lots to do!",
  "Take a deep breath...",
  "Hmm...",
  "Focus time?",
];

export function RestiaCompanion() {
  const { isOpen, setIsOpen, animState, messages, sendMessage, input, setInput, streaming, isRoaming, setIsRoaming } = useRestia();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Position state
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isMoving, setIsMoving] = useState(false);
  const [moveDuration, setMoveDuration] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [bubbleText, setBubbleText] = useState<string | null>(null);
  const [internalAnim, setInternalAnim] = useState<"idle" | "magic" | null>(null);
  
  // Initialization
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Start at bottom right
    setPos({ 
      x: typeof window !== 'undefined' ? window.innerWidth - 120 : 1000, 
      y: typeof window !== 'undefined' ? window.innerHeight - 120 : 800 
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Autonomous Roaming Logic
  useEffect(() => {
    if (!mounted || !isRoaming || isOpen) return;

    let timeoutId: NodeJS.Timeout;

    const roamingLoop = () => {
      // 30% chance to move, 70% chance to just stay idle and maybe think
      const shouldMove = Math.random() > 0.7;

      if (shouldMove) {
        // Calculate new position respecting window bounds
        const padding = 150; // Sprite size to prevent clipping
        const maxX = Math.max(0, window.innerWidth - padding);
        const maxY = Math.max(0, window.innerHeight - padding);

        const newX = Math.max(0, Math.min(Math.random() * maxX, maxX));
        const newY = Math.max(0, Math.min(Math.random() * maxY, maxY));

        // Calculate distance to determine duration (e.g. 150 pixels per second)
        const dist = Math.sqrt(Math.pow(newX - pos.x, 2) + Math.pow(newY - pos.y, 2));
        const duration = Math.max(2, dist / 150); 
        
        setFlipX(newX > pos.x);
        setMoveDuration(duration);
        setIsMoving(true);
        setPos({ x: newX, y: newY });

        // Wait for movement to finish, then go back to idle
        timeoutId = setTimeout(() => {
          setIsMoving(false);
          roamingLoop();
        }, duration * 1000);
      } else {
        setIsMoving(false);
        setInternalAnim("idle");
        
        // Occasional random thought bubble
        if (Math.random() > 0.7) {
          setBubbleText(RANDOM_THOUGHTS[Math.floor(Math.random() * RANDOM_THOUGHTS.length)]);
          setTimeout(() => setBubbleText(null), 4000);
        }
        
        // Idle for 10 to 25 seconds
        timeoutId = setTimeout(() => {
          setInternalAnim(null);
          roamingLoop();
        }, 10000 + Math.random() * 15000);
      }
    };

    // Initial wait
    timeoutId = setTimeout(roamingLoop, 5000);

    return () => clearTimeout(timeoutId);
  }, [mounted, isRoaming, isOpen, pos.x, pos.y]);

  // Determine animation class based on context + internal state
  let animClass = "restia-idle";
  if (animState === "thinking" || isMoving) animClass = "restia-thinking";
  if (animState === "action" || internalAnim === "magic") animClass = "restia-action";

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @keyframes restia-idle {
          0%, 33.2% { background-position: 0% 0%; }
          33.3%, 66.5% { background-position: 50% 0%; }
          66.6%, 100% { background-position: 100% 0%; }
        }
        @keyframes restia-thinking {
          0%, 33.2% { background-position: 0% 50%; }
          33.3%, 66.5% { background-position: 50% 50%; }
          66.6%, 100% { background-position: 100% 50%; }
        }
        @keyframes restia-action {
          0%, 33.2% { background-position: 0% 100%; }
          33.3%, 66.5% { background-position: 50% 100%; }
          66.6%, 100% { background-position: 100% 100%; }
        }
        .sprite-base {
          background-image: url('/restia-sprite.png');
          background-size: 300% 300%;
        }
        .restia-idle { animation: restia-idle 2s infinite; }
        .restia-thinking { animation: restia-thinking 0.8s infinite; }
        .restia-action { animation: restia-action 0.5s infinite; }
      `}</style>

      {/* Roaming Container */}
      <motion.div 
        ref={containerRef}
        drag
        dragMomentum={false}
        onDragStart={() => setIsRoaming(false)}
        animate={{ x: pos.x, y: pos.y }}
        transition={{ 
          duration: isMoving ? moveDuration : 0.2, 
          ease: "linear" 
        }}
        className="fixed top-0 left-0 z-[100] pointer-events-auto flex flex-col items-center justify-center"
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: -20, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }}
              className="absolute bottom-full mb-4 w-[380px] h-[500px] max-h-[70vh] bg-[#0a0a0f]/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden origin-bottom"
              // Fix position relative to the avatar to keep it centered
              style={{ left: "50%", x: "-50%" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-white">Restia</span>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setIsRoaming(!isRoaming)} 
                    className={`p-1.5 rounded-lg transition-colors ${isRoaming ? "text-white/50 hover:text-white" : "text-primary bg-primary/10"}`}
                    title={isRoaming ? "Tell her to stay" : "Allow her to roam"}
                  >
                    {isRoaming ? <Navigation className="h-4 w-4" /> : <Anchor className="h-4 w-4" />}
                  </button>
                  <button onClick={() => setIsOpen(false)} className="p-1.5 text-white/50 hover:text-white transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" onPointerDownCapture={(e) => e.stopPropagation()}>
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm text-white/70">Hi! I'm Restia. What can I help you with today?</p>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    if (msg.toolCall) {
                      return (
                        <div key={i} className="flex justify-start">
                          <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-xs text-primary">
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20">✓</span>
                            <span className="font-medium">
                              {msg.toolCall.type === "task" && `Created task: ${msg.toolCall.data.title}`}
                              {msg.toolCall.type === "tasksBatch" && `Created ${msg.toolCall.data.tasks.length} tasks`}
                              {msg.toolCall.type === "event" && `Scheduled event: ${msg.toolCall.data.title}`}
                              {msg.toolCall.type === "reminder" && `Set reminder for task #${msg.toolCall.data.taskId}`}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    if (!msg.content && !msg.streaming) return null;
                    return (
                      <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                        <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-primary text-white" : "bg-white/10 text-white/70"}`}>
                          {msg.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                        </div>
                        <div className={`rounded-2xl px-3.5 py-2 max-w-[80%] text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "bg-primary text-white" : "bg-white/5 text-white/90 border border-white/5"}`}>
                          {msg.content || (msg.streaming && <span className="opacity-60 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Thinking…</span>)}
                          {msg.streaming && msg.content && <span className="inline-block w-1 h-3 ml-1 bg-current animate-pulse align-middle" />}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-white/5 bg-white/[0.02]" onPointerDownCapture={(e) => e.stopPropagation()}>
                <form 
                  onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
                  className="flex gap-2"
                >
                  <input
                    autoFocus
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={streaming ? "Restia is typing..." : "Ask Restia..."}
                    disabled={streaming}
                    className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 text-sm disabled:opacity-50 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || streaming}
                    className="px-3 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-50 hover:bg-primary/90 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Thought Bubble */}
        <AnimatePresence>
          {bubbleText && !isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="absolute bottom-full mb-3 px-4 py-2 bg-white text-black text-xs font-semibold rounded-2xl rounded-br-none shadow-xl border border-black/10 whitespace-nowrap z-50 pointer-events-none"
            >
              {bubbleText}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Character Bubble */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="relative group outline-none focus:outline-none"
        >
          {/* Subtle glow instead of solid background */}
          <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full scale-75 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500" />
          
          <div
            className={`sprite-base ${animClass} w-[150px] h-[150px] overflow-visible transform group-hover:scale-105 group-active:scale-95 filter drop-shadow-2xl`} 
            style={{ 
              transform: flipX ? 'scaleX(-1)' : 'scaleX(1)',
              transition: 'transform 0.3s ease'
            }}
          />
        </button>
      </motion.div>
    </>
  );
}
