"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Key, MessageSquare, ArrowRight, ArrowLeft, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { title: "Initialize Core", icon: Sparkles, subtitle: "Neural Link Activation" },
  { title: "Authentication", icon: Key, subtitle: "LLM Subsystem" },
  { title: "Telemetry", icon: MessageSquare, subtitle: "Webhook Relays" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleComplete() {
    setSaving(true);
    try {
      const settings: Record<string, any> = {};
      if (apiKey) settings.geminiApiKey = apiKey;
      if (telegramToken) settings.telegramBotToken = telegramToken;
      if (telegramChatId) settings.telegramChatId = telegramChatId;
      settings.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("SYSTEM INITIALIZED.");
      router.push("/dashboard");
    } catch (e) {
      toast.error("INITIALIZATION FAILED");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background selection:bg-primary/30">
      {/* Ambient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none z-0" />
      <div className="fixed top-[-15%] left-[-10%] h-[600px] w-[600px] rounded-full bg-primary/10 blur-[180px] pointer-events-none" />
      <div className="fixed bottom-[-15%] right-[-10%] h-[700px] w-[700px] rounded-full bg-accent-fixed/10 blur-[180px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 \${i === step ? "w-8 bg-primary shadow-sm" : i < step ? "w-2 bg-primary/50" : "w-2 bg-surface-variant/30"}`} />
          ))}
        </div>

        {/* Card */}
        <div className="glass-panel module-border rounded relative overflow-hidden">
          {/* Aesthetic UI elements */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-primary" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-primary" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-primary" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-primary" />
          
          <div className="p-1 border-b border-primary/20 bg-primary/10">
            <p className="font-mono-label text-[9px] text-primary uppercase tracking-[0.2em] px-2">Setup Sequence // Step 0{step + 1}</p>
          </div>

          {step === 0 && (
            <div className="p-10 text-center relative">
              <div className="h-20 w-20 rounded bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-6 shadow-sm relative group">
                <div className="absolute inset-0 bg-primary/20 group-hover:bg-primary/40 transition-colors animate-pulse" />
                <Sparkles className="h-10 w-10 text-primary  relative z-10" />
              </div>
              <h1 className="text-3xl font-data-metric font-bold text-on-surface uppercase tracking-tight mb-3">
                Initialize <span className="text-primary ">Core</span>
              </h1>
              <p className="font-body-sm text-on-surface-variant max-w-sm mx-auto mb-8">
                Establish neural link with the central intelligence. Restia manages directives, schedules, and telemetry with autonomous precision.
              </p>
              <div className="grid grid-cols-3 gap-4 text-center mb-8">
                {[
                  { icon: "📋", label: "Directives" },
                  { icon: "📅", label: "Chronos" },
                  { icon: "🤖", label: "LLM Sync" },
                ].map(f => (
                  <div key={f.label} className="rounded border border-primary/20 bg-primary/5 p-4 hover:border-primary/50 hover:bg-primary/10 transition-all cursor-default">
                    <span className="text-2xl opacity-80">{f.icon}</span>
                    <p className="font-mono-label text-[9px] text-primary uppercase tracking-wider mt-2">{f.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="p-10">
              <div className="h-14 w-14 rounded bg-accent-fixed/10 border border-accent-fixed/30 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(255,0,255,0.15)]">
                <Key className="h-7 w-7 text-accent-fixed drop-shadow-[0_0_8px_rgba(255,0,255,0.8)]" />
              </div>
              <h2 className="text-2xl font-data-metric font-bold text-on-surface uppercase tracking-tight mb-2">
                LLM <span className="text-accent-fixed drop-shadow-[0_0_8px_rgba(255,0,255,0.8)]">Subsystem</span>
              </h2>
              <p className="font-body-sm text-on-surface-variant mb-6">
                Restia requires a valid Gemini API key to activate autonomous processing modules.
              </p>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-mono-label text-[10px] text-accent-fixed uppercase tracking-widest">API Hashkey</label>
                    <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="font-mono-label text-[9px] text-accent-fixed/70 hover:text-accent-fixed uppercase tracking-widest flex items-center gap-1 transition-colors">
                      Acquire Token <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full rounded border border-accent-fixed/30 bg-background px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:border-accent-fixed focus:outline-none focus:ring-1 focus:ring-accent-fixed/30 font-mono-label transition-all"
                  />
                </div>
                {!apiKey && (
                  <p className="font-mono-label text-[9px] text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded px-4 py-2.5 uppercase tracking-wider leading-relaxed">
                    [WARNING] Missing token will restrict core intelligence modules (NLP, TTS, Analysis). Can be appended later.
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="p-10">
              <div className="h-14 w-14 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <MessageSquare className="h-7 w-7 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              </div>
              <h2 className="text-2xl font-data-metric font-bold text-on-surface uppercase tracking-tight mb-2">
                Webhook <span className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]">Relays</span>
              </h2>
              <p className="font-body-sm text-on-surface-variant mb-6">
                Optional: Establish secure channel to Telegram for remote telemetry and alerts.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="font-mono-label text-[10px] text-emerald-500 uppercase tracking-widest block mb-1.5">Bot Handshake Token</label>
                  <input
                    type="text"
                    value={telegramToken}
                    onChange={e => setTelegramToken(e.target.value)}
                    placeholder="123456789:ABCdef..."
                    className="w-full rounded border border-emerald-500/30 bg-background px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 font-mono-label transition-all"
                  />
                </div>
                <div>
                  <label className="font-mono-label text-[10px] text-emerald-500 uppercase tracking-widest block mb-1.5">Target Chat ID</label>
                  <input
                    type="text"
                    value={telegramChatId}
                    onChange={e => setTelegramChatId(e.target.value)}
                    placeholder="e.g. 987654321..."
                    className="w-full rounded border border-emerald-500/30 bg-background px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 font-mono-label transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between px-10 py-6 border-t border-primary/20 bg-background/50">
            {step > 0 ? (
              <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 font-mono-label text-[10px] text-on-surface-variant hover:text-primary uppercase tracking-widest transition-colors">
                <ArrowLeft className="h-3 w-3" /> Retreat
              </button>
            ) : <div />}

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="flex items-center gap-2 px-6 py-2.5 rounded border border-primary/50 bg-primary/20 text-primary font-mono-label text-[10px] uppercase tracking-widest hover:bg-primary/40 transition-colors shadow-sm hover:shadow-sm"
              >
                Proceed <ArrowRight className="h-3 w-3" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded border border-emerald-500/50 bg-emerald-500/20 text-emerald-500 font-mono-label text-[10px] uppercase tracking-widest hover:bg-emerald-500/40 transition-colors disabled:opacity-50 shadow-[0_0_10px_rgba(16,185,129,0.2)] hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]"
              >
                {saving ? "Booting..." : "Engage"} <Check className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Skip */}
        <button
          onClick={() => router.push("/dashboard")}
          className="block mx-auto mt-6 font-mono-label text-[9px] text-on-surface-variant/50 hover:text-on-surface-variant uppercase tracking-[0.2em] transition-colors"
        >
          [ Bypass Sequence ]
        </button>
      </div>
    </div>
  );
}
