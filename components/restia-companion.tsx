"use client";

import { useEffect, useRef } from "react";
import { useRestia } from "./restia-context";
import { Send, Sparkles, Loader2, User, Bot, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function RestiaCompanion() {
  const { isOpen, setIsOpen, animState, messages, sendMessage, input, setInput, streaming } = useRestia();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Click outside to close (optional, but good UX)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, setIsOpen]);

  // Determine animation class
  let animClass = "restia-idle";
  if (animState === "thinking") animClass = "restia-thinking";
  if (animState === "action") animClass = "restia-action";

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4 pointer-events-auto">
      <style>{`
        @keyframes restia-idle {
          0%, 49.9% { background-position: 0% 0%; }
          50%, 100% { background-position: 50% 0%; }
        }
        @keyframes restia-thinking {
          0%, 33.2% { background-position: 0% 50%; }
          33.3%, 66.5% { background-position: 50% 50%; }
          66.6%, 100% { background-position: 100% 50%; }
        }
        @keyframes restia-action {
          0%, 49.9% { background-position: 0% 100%; }
          50%, 100% { background-position: 50% 100%; }
        }
        .sprite-base {
          background-image: url('/restia-sprite.jpg');
          background-size: 300% 300%;
        }
        .restia-idle { animation: restia-idle 2s infinite; }
        .restia-thinking { animation: restia-thinking 0.8s infinite; }
        .restia-action { animation: restia-action 0.5s infinite; }
      `}</style>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }}
            className="w-[380px] h-[500px] max-h-[80vh] bg-[#0a0a0f]/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-white">Restia</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
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
                            {msg.toolCall.type === "task" && \`Created task: \${msg.toolCall.data.title}\`}
                            {msg.toolCall.type === "tasksBatch" && \`Created \${msg.toolCall.data.tasks.length} tasks\`}
                            {msg.toolCall.type === "event" && \`Scheduled event: \${msg.toolCall.data.title}\`}
                            {msg.toolCall.type === "reminder" && \`Set reminder for task #\${msg.toolCall.data.taskId}\`}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  if (!msg.content && !msg.streaming) return null;
                  return (
                    <div key={i} className={\`flex gap-3 \${msg.role === "user" ? "flex-row-reverse" : ""}\`}>
                      <div className={\`h-7 w-7 rounded-full flex items-center justify-center shrink-0 \${msg.role === "user" ? "bg-primary text-white" : "bg-white/10 text-white/70"}\`}>
                        {msg.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                      </div>
                      <div className={\`rounded-2xl px-3.5 py-2 max-w-[80%] text-sm leading-relaxed whitespace-pre-wrap \${msg.role === "user" ? "bg-primary text-white" : "bg-white/5 text-white/90 border border-white/5"}\`}>
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
            <div className="p-3 border-t border-white/5 bg-white/[0.02]">
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

      {/* Floating Character Bubble */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative group outline-none"
      >
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-75 group-hover:scale-110 transition-transform duration-500" />
        <div 
          className={\`sprite-base \${animClass} w-[100px] h-[100px] rounded-full border-2 border-primary/40 shadow-2xl bg-white overflow-hidden transition-all duration-300 transform group-hover:scale-105 group-active:scale-95\`} 
          style={{ mixBlendMode: 'normal' }}
        />
        {/* Unread badge or indicator could go here */}
      </button>
    </div>
  );
}
