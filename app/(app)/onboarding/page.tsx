"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Key, MessageSquare, ArrowRight, ArrowLeft, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { title: "Welcome to Restia", icon: Sparkles, subtitle: "Your AI Chief of Staff" },
  { title: "Connect Your AI", icon: Key, subtitle: "Power up with Gemini" },
  { title: "Stay Connected", icon: MessageSquare, subtitle: "Optional integrations" },
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
      toast.success("Setup complete! Welcome aboard.");
      router.push("/dashboard");
    } catch (e) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient */}
      <div className="fixed top-[-15%] left-[-10%] h-[600px] w-[600px] rounded-full bg-primary/15 blur-[180px] pointer-events-none" />
      <div className="fixed bottom-[-15%] right-[-10%] h-[700px] w-[700px] rounded-full bg-blue-600/10 blur-[180px] pointer-events-none" />

      <div className="relative w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all duration-500 ${i === step ? "w-8 bg-primary" : i < step ? "w-2 bg-primary/50" : "w-2 bg-white/10"}`} />
          ))}
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden">
          {step === 0 && (
            <div className="p-10 text-center">
              <div className="h-20 w-20 rounded-3xl bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight mb-3">Welcome to Restia</h1>
              <p className="text-white/50 text-sm leading-relaxed max-w-sm mx-auto mb-8">
                Your intelligent AI Chief of Staff. Restia manages your tasks, calendar, and reminders — 
                and proactively helps you stay on top of everything.
              </p>
              <div className="grid grid-cols-3 gap-4 text-center mb-8">
                {[
                  { emoji: "📋", label: "Smart Tasks" },
                  { emoji: "📅", label: "Calendar" },
                  { emoji: "🤖", label: "AI Assistant" },
                ].map(f => (
                  <div key={f.label} className="rounded-2xl bg-white/5 border border-white/5 p-4">
                    <span className="text-2xl">{f.emoji}</span>
                    <p className="text-xs text-white/50 mt-2 font-medium">{f.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="p-10">
              <div className="h-14 w-14 rounded-2xl bg-amber-500/20 flex items-center justify-center mb-6">
                <Key className="h-7 w-7 text-amber-400" />
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">Connect Your AI</h2>
              <p className="text-white/40 text-sm mb-6">
                Restia uses Google's Gemini AI. Get your free API key to enable AI features.
              </p>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-white/60">Gemini API Key</label>
                    <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-1">
                      Get free key <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
                {!apiKey && (
                  <p className="text-xs text-amber-400/80 bg-amber-500/10 rounded-xl px-4 py-2.5">
                    ⚠️ Without an API key, AI features (assistant, briefings, TTS) will be disabled. You can add it later in Settings.
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="p-10">
              <div className="h-14 w-14 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6">
                <MessageSquare className="h-7 w-7 text-blue-400" />
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">Stay Connected</h2>
              <p className="text-white/40 text-sm mb-6">
                Optional: Get reminders and updates via Telegram. Skip if not needed.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-white/60 block mb-1.5">Telegram Bot Token</label>
                  <input
                    type="text"
                    value={telegramToken}
                    onChange={e => setTelegramToken(e.target.value)}
                    placeholder="123456789:ABCdef..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/60 block mb-1.5">Telegram Chat ID</label>
                  <input
                    type="text"
                    value={telegramChatId}
                    onChange={e => setTelegramChatId(e.target.value)}
                    placeholder="Your chat ID..."
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between px-10 py-6 border-t border-white/5">
            {step > 0 ? (
              <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            ) : <div />}

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 transition-opacity"
              >
                Next <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? "Saving..." : "Complete Setup"} <Check className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Skip */}
        <button
          onClick={() => router.push("/dashboard")}
          className="block mx-auto mt-4 text-xs text-white/20 hover:text-white/40 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
