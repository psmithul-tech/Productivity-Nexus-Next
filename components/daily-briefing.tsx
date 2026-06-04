"use client";
import { useState, useEffect } from "react";
import { X, Sparkles, Sun, Moon, CloudSun, Loader2 } from "lucide-react";

export function DailyBriefing() {
  const [open, setOpen] = useState(false);
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if briefing was already shown today
    const today = new Date().toISOString().split("T")[0];
    const lastShown = localStorage.getItem("restia_briefing_date");
    if (lastShown === today) return;

    // Show briefing after a small delay
    const timer = setTimeout(() => {
      setOpen(true);
      fetchBriefing();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  async function fetchBriefing() {
    setLoading(true);
    try {
      const res = await fetch("/api/briefing");
      if (res.ok) {
        const data = await res.json();
        setBriefing(data.briefing);
      } else {
        setBriefing(null);
      }
    } catch {
      setBriefing(null);
    } finally {
      setLoading(false);
    }
  }

  function dismiss() {
    setOpen(false);
    setDismissed(true);
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem("restia_briefing_date", today);
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const GreetIcon = hour < 12 ? Sun : hour < 17 ? CloudSun : Moon;

  if (!open || dismissed) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={dismiss} />
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f0f1a] to-[#0a0a12] shadow-2xl shadow-primary/10 overflow-hidden">
        {/* Header glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-32 w-64 bg-primary/20 blur-[80px] pointer-events-none" />

        {/* Close */}
        <button onClick={dismiss} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors z-10">
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="relative p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center">
              <GreetIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">{greeting}!</h2>
              <p className="text-xs text-white/40 font-medium">Your daily briefing from Restia</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 gap-3">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              <span className="text-sm text-white/40">Preparing your briefing…</span>
            </div>
          ) : briefing ? (
            <div className="prose prose-invert prose-sm max-w-none">
              <div className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap space-y-2">
                {briefing}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Sparkles className="h-8 w-8 text-primary/40 mx-auto mb-3" />
              <p className="text-sm text-white/40">Add your Gemini API key in Settings to enable AI briefings</p>
            </div>
          )}

          <button
            onClick={dismiss}
            className="mt-6 w-full py-3 rounded-2xl bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-colors"
          >
            Let's Go →
          </button>
        </div>
      </div>
    </div>
  );
}
