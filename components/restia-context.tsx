"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { toast } from "sonner";

export type AnimationState = "idle" | "thinking" | "action";
type Msg = { role: "user" | "assistant"; content: string; streaming?: boolean; toolCall?: { type: string; data: any } };
type Conv = { id: number; title: string; createdAt: string };

interface RestiaContextType {
  isOpen: boolean;
  setIsOpen: (o: boolean) => void;
  animState: AnimationState;
  messages: Msg[];
  sendMessage: (content: string) => Promise<void>;
  input: string;
  setInput: (v: string) => void;
  streaming: boolean;
}

const RestiaContext = createContext<RestiaContextType | null>(null);

export function RestiaProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [animState, setAnimState] = useState<AnimationState>("idle");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  
  const [activeId, setActiveId] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-close chat when clicking outside is handled in the companion component
  // But we need to load or start a conversation
  useEffect(() => {
    // Optionally fetch recent conversation or just start fresh
    // We'll just start fresh for the floating widget
  }, []);

  async function sendMessage(content: string) {
    if (!content.trim() || streaming) return;
    
    // Ensure she is open when you talk to her programmatically
    setIsOpen(true);
    setAnimState("thinking");

    let convId = activeId;
    if (!convId) {
      try {
        const res = await fetch("/api/assistant", { 
          method: "POST", 
          headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify({ content: content.slice(0, 50) }) 
        });
        if (!res.ok) throw new Error();
        const conv = await res.json();
        convId = conv.id;
        setActiveId(convId);
      } catch {
        toast.error("Failed to start conversation");
        setAnimState("idle");
        return;
      }
    }

    setMessages((p) => [...p, { role: "user", content }, { role: "assistant", content: "", streaming: true }]);
    setInput("");
    setStreaming(true);
    
    const controller = new AbortController();
    abortRef.current = controller;
    
    let didAction = false;

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
              setMessages((p) => { 
                const n = [...p]; 
                n[n.length - 1] = { role: "assistant", content: fullText, streaming: true }; 
                return n; 
              });
            }
            if (json.task) {
              didAction = true;
              setMessages((p) => [...p, { role: "assistant", content: "", toolCall: { type: "task", data: json.task } }, { role: "assistant", content: "", streaming: true }]);
            }
            if (json.tasksBatch) {
              didAction = true;
              setMessages((p) => [...p, { role: "assistant", content: "", toolCall: { type: "tasksBatch", data: json.tasksBatch } }, { role: "assistant", content: "", streaming: true }]);
            }
            if (json.event) {
              didAction = true;
              setMessages((p) => [...p, { role: "assistant", content: "", toolCall: { type: "event", data: json.event } }, { role: "assistant", content: "", streaming: true }]);
            }
            if (json.reminder) {
              didAction = true;
              setMessages((p) => [...p, { role: "assistant", content: "", toolCall: { type: "reminder", data: json.reminder } }, { role: "assistant", content: "", streaming: true }]);
            }
            if (json.done) {
              setMessages((p) => { 
                const n = [...p]; 
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
      
      if (didAction) {
        setAnimState("action");
        setTimeout(() => setAnimState("idle"), 3000);
      } else {
        setAnimState("idle");
      }
    }
  }

  return (
    <RestiaContext.Provider value={{ isOpen, setIsOpen, animState, messages, sendMessage, input, setInput, streaming }}>
      {children}
    </RestiaContext.Provider>
  );
}

export function useRestia() {
  const ctx = useContext(RestiaContext);
  if (!ctx) throw new Error("useRestia must be used within RestiaProvider");
  return ctx;
}
