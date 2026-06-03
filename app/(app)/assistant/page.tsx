"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Plus, Trash2, Bot, User, Sparkles, MessageSquare, Loader2, Volume2, Square } from "lucide-react";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string; streaming?: boolean; toolCall?: { type: string; data: any } };
type Conv = { id: number; title: string; createdAt: string };

const SUGGESTIONS = [
  "What are my most urgent tasks today?",
  "Summarize my week ahead",
  "What should I work on right now?",
  "What tasks are overdue?",
  "Help me plan my day",
];

export default function AssistantPage() {
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [playingAudioIndex, setPlayingAudioIndex] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { loadConversations(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    if (activeId) loadMessages(activeId);
  }, [activeId]);

  async function loadConversations() {
    const res = await fetch("/api/assistant");
    if (res.ok) setConversations(await res.json());
  }

  async function loadMessages(id: number) {
    if (streaming) return;
    const res = await fetch(`/api/assistant/${id}`);
    if (res.ok) {
      const data = await res.json();
      setMessages((data.messages || []).map((m: any) => ({ role: m.role, content: m.content })));
    }
  }

  async function newConversation() {
    const res = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "New conversation" }) });
    if (res.ok) {
      const conv = await res.json();
      setConversations((p) => [conv, ...p]);
      setActiveId(conv.id);
      setMessages([]);
    }
  }

  async function deleteConversation(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    await fetch(`/api/assistant/${id}`, { method: "DELETE" });
    setConversations((p) => p.filter((c) => c.id !== id));
    if (activeId === id) { setActiveId(null); setMessages([]); }
  }

  async function sendMessage(content: string) {
    if (!content.trim() || streaming) return;
    let convId = activeId;
    if (!convId) {
      const res = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: content.slice(0, 50) }) });
      if (!res.ok) return;
      const conv = await res.json();
      setConversations((p) => [conv, ...p]);
      convId = conv.id;
      setActiveId(convId);
    }
    setMessages((p) => [...p, { role: "user", content }, { role: "assistant", content: "", streaming: true }]);
    setInput("");
    setStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch(`/api/assistant/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error("Failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(line.slice(6));
            if (json.content) {
              fullText += json.content;
              setMessages((p) => { const n = [...p]; n[n.length - 1] = { role: "assistant", content: fullText, streaming: true }; return n; });
            }
            if (json.task) {
              setMessages((p) => [...p, { role: "assistant", content: "", toolCall: { type: "task", data: json.task } }, { role: "assistant", content: "", streaming: true }]);
            }
            if (json.tasksBatch) {
              setMessages((p) => [...p, { role: "assistant", content: "", toolCall: { type: "tasksBatch", data: json.tasksBatch } }, { role: "assistant", content: "", streaming: true }]);
            }
            if (json.event) {
              setMessages((p) => [...p, { role: "assistant", content: "", toolCall: { type: "event", data: json.event } }, { role: "assistant", content: "", streaming: true }]);
            }
            if (json.reminder) {
              setMessages((p) => [...p, { role: "assistant", content: "", toolCall: { type: "reminder", data: json.reminder } }, { role: "assistant", content: "", streaming: true }]);
            }
            if (json.done) {
              setMessages((p) => { 
                const n = [...p]; 
                // Clean up any empty streaming messages left over
                if (n[n.length - 1].content === "" && !n[n.length - 1].toolCall) {
                  n.pop();
                } else {
                  n[n.length - 1] = { ...n[n.length - 1], streaming: false }; 
                }
                return n; 
              });
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast.error("Failed to get response");
        setMessages((p) => p.slice(0, -1));
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  async function playTTS(text: string, index: number) {
    if (playingAudioIndex === index) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingAudioIndex(null);
      return;
    }
    
    // Stop any existing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    try {
      setPlayingAudioIndex(index);
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Failed to generate TTS");
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.onended = () => {
        setPlayingAudioIndex(null);
        audioRef.current = null;
        URL.revokeObjectURL(url);
      };
      
      audio.play();
    } catch (err) {
      toast.error("Failed to play audio");
      setPlayingAudioIndex(null);
    }
  }

  return (
    <div className="flex h-[calc(100vh-96px)] overflow-hidden rounded-xl border border-border">
      {/* Sidebar */}
      <div className="w-60 border-r border-border flex flex-col bg-card/50 shrink-0">
        <div className="p-3 border-b border-border">
          <button
            onClick={newConversation}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {conversations.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No conversations yet</p>}
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => { setActiveId(conv.id); setMessages([]); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between group transition-colors ${activeId === conv.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60" />
                <span className="truncate">{conv.title}</span>
              </span>
              <button className="opacity-0 group-hover:opacity-100 shrink-0 ml-1 p-0.5 rounded hover:text-destructive" onClick={(e) => deleteConversation(conv.id, e)}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
            <div className="flex flex-col items-center gap-3 text-center max-w-md">
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(265 90% 65% / 0.2), hsl(265 70% 45% / 0.2))" }}>
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-xl font-bold">AI Chief of Staff</h2>
              <p className="text-muted-foreground text-sm">Your intelligent executive assistant. Ask about your tasks, schedule, or let me help you prioritize your day.</p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-md">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => sendMessage(s)} className="text-left px-4 py-2.5 rounded-lg border border-border hover:bg-muted text-sm transition-colors text-muted-foreground hover:text-foreground">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => {
              if (msg.toolCall) {
                return (
                  <div key={i} className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px]">✓</span>
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
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={`rounded-2xl px-4 py-2.5 max-w-[80%] text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground border border-border"} relative group/msg`}>
                  {msg.content || (msg.streaming && <span className="opacity-60 animate-pulse flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Thinking…</span>)}
                  {msg.streaming && msg.content && <span className="inline-block w-1 h-4 ml-0.5 bg-current animate-pulse align-middle" />}
                  {msg.role === "assistant" && !msg.streaming && msg.content && (
                    <button
                      onClick={() => playTTS(msg.content, i)}
                      className="absolute -right-10 top-2 p-1.5 rounded-full bg-muted border border-border text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover/msg:opacity-100"
                      title={playingAudioIndex === i ? "Stop audio" : "Play audio"}
                    >
                      {playingAudioIndex === i ? <Square className="h-3.5 w-3.5 fill-current" /> : <Volume2 className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            )})}
            <div ref={bottomRef} />
          </div>
        )}

        <div className="p-4 border-t border-border">
          <div className="flex gap-2 max-w-2xl mx-auto">
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder={streaming ? "Generating response…" : "Ask your Chief of Staff anything…"}
              disabled={streaming}
              className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || streaming}
              className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">Powered by Gemini 3.1 Flash-Lite</p>
        </div>
      </div>
    </div>
  );
}
