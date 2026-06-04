"use client";
import { useState, useRef } from "react";
import { Sparkles, Loader2, Send, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function NLQuickAdd() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch("/api/nl-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input, timezone }),
      });

      if (!res.ok) throw new Error("Failed to parse");
      const { type, data } = await res.json();

      if (type === "task") {
        const taskRes = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (taskRes.ok) {
          const dueDateStr = data.dueDate ? new Date(data.dueDate).toLocaleString("en-US", {
            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
          }) : "";
          toast.success(`✅ Task created`, {
            description: `${data.title}${dueDateStr ? ` · ${dueDateStr}` : ""}`,
            duration: 3000,
          });
          setInput("");
          router.refresh();
        } else {
          toast.error("Failed to create task");
        }
      } else if (type === "event") {
        const eventRes = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: data.title,
            startTime: data.startTime,
            endTime: data.endTime,
          }),
        });
        if (eventRes.ok) {
          const startDate = data.startTime ? new Date(data.startTime).toLocaleString("en-US", {
            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
          }) : "";
          toast.success(`📅 Event scheduled`, {
            description: `${data.title}${startDate ? ` · ${startDate}` : ""}`,
            duration: 3000,
          });
          setInput("");
          router.refresh();
        } else {
          toast.error("Failed to create event");
        }
      } else {
        toast.error("Couldn't understand that", { description: "Try 'Buy groceries' or 'Meeting at 3pm tomorrow'" });
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setInput("");
      inputRef.current?.blur();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full group">
      {/* Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/15 via-blue-500/10 to-primary/15 rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative flex items-center bg-white/[0.05] border border-white/10 group-focus-within:border-primary/30 rounded-2xl px-3 py-2 transition-all duration-200 gap-2">
        <div className="shrink-0 text-primary/60 group-focus-within:text-primary transition-colors">
          {loading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Sparkles className="h-4 w-4" />
          }
        </div>

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Add task or event — "Buy milk", "Meeting tomorrow at 3pm"'
          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
          disabled={loading}
        />

        {input && !loading && (
          <button
            type="button"
            onClick={() => setInput("")}
            className="shrink-0 p-1 rounded-lg text-white/30 hover:text-white transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="shrink-0 bg-primary/15 hover:bg-primary/25 disabled:opacity-40 text-primary p-1.5 rounded-xl transition-colors"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </form>
  );
}
