"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppSettings {
  workdayStart: string;
  workdayEnd: string;
  quietHoursStart: string;
  quietHoursEnd: string;
  focusModeEnabled: boolean;
  hourlyUpdatesEnabled: boolean;
  timezone: string;
  discordWebhookUrl: string;
  telegramBotToken: string;
  telegramChatId: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  geminiApiKey: string;
  username: string;
}

const DEFAULTS: AppSettings = {
  workdayStart: "09:00",
  workdayEnd: "18:00",
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  focusModeEnabled: false,
  hourlyUpdatesEnabled: true,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  discordWebhookUrl: "",
  telegramBotToken: "",
  telegramChatId: "",
  geminiApiKey: "",
  username: "",
};

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5 backdrop-blur-xl sm:p-6">
      <div className="mb-4 border-b border-border pb-4">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function TimeField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
      />
      {hint && <p className="mt-1 text-[10px] text-muted-foreground/60">{hint}</p>}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border/50 bg-background/20 px-4 py-3.5 transition-colors hover:bg-background/30">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {/* Toggle switch */}
      <div
        className={`relative flex-shrink-0 h-6 w-11 rounded-full border transition-all duration-200 ${
          checked
            ? "border-primary/40 bg-primary/30"
            : "border-border bg-background/50"
        }`}
        onClick={() => onChange(!checked)}
      >
        <div
          className={`absolute top-0.5 h-5 w-5 rounded-full border shadow transition-all duration-200 ${
            checked
              ? "left-[22px] border-primary bg-primary"
              : "left-0.5 border-border bg-muted-foreground/40"
          }`}
        />
      </div>
    </label>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<"discord" | "telegram" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [usernameInput, setUsernameInput] = useState("");

  async function fetchSettings() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/settings");
      if (res.status === 404) {
        setSettings(DEFAULTS);
        setUsernameInput("");
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: AppSettings = await res.json();
      const sanitizedData = Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, v === null ? "" : v])
      ) as Partial<AppSettings>;
      const merged = { ...DEFAULTS, ...sanitizedData };
      setSettings(merged);
      setUsernameInput(merged.username ?? "");
    } catch (e) {
      setError((e as Error).message);
      setSettings(DEFAULTS);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSettings();
    
    // Handle redirect errors from OAuth
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    const success = params.get("success");
    if (err) toast.error("Google Auth Failed", { description: err.replace(/_/g, " ") });
    if (success === "google_connected") toast.success("Google Calendar connected successfully!");
    
    // Clean up URL
    if (err || success) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Check username availability with debounce
  useEffect(() => {
    if (!usernameInput || usernameInput === settings.username) {
      setUsernameStatus("idle");
      return;
    }
    const clean = usernameInput.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (clean.length < 3) { setUsernameStatus("invalid"); return; }
    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/username?check=${encodeURIComponent(clean)}`);
        const data = await res.json();
        setUsernameStatus(data.available ? "available" : "taken");
      } catch {
        setUsernameStatus("idle");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [usernameInput, settings.username]);

  function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      setIsDirty(false);
      toast.success("Settings saved successfully", {
        description: "Your preferences have been updated.",
        duration: 3000,
      });
    } catch (e) {
      toast.error("Failed to save settings", {
        description: (e as Error).message,
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest(type: "discord" | "telegram") {
    setTesting(type);
    try {
      const payload: any = { type, origin: window.location.origin };
      if (type === "discord") payload.url = settings.discordWebhookUrl;
      if (type === "telegram") {
        payload.token = settings.telegramBotToken;
        payload.chatId = settings.telegramChatId;
      }
      
      const res = await fetch("/api/settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to test integration");
      
      toast.success("Test Successful", { description: data.message });
    } catch (e: any) {
      toast.error("Test Failed", { description: e.message });
    } finally {
      setTesting(null);
    }
  }

  function handleReset() {
    setSettings(DEFAULTS);
    setIsDirty(true);
    toast.info("Settings reset to defaults", { duration: 2000 });
  }

  async function handleDisconnectGoogle() {
    try {
      setSaving(true);
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, googleAccessToken: null, googleRefreshToken: null }),
      });
      if (!res.ok) throw new Error("Failed to disconnect");
      setSettings(prev => ({ ...prev, googleAccessToken: "", googleRefreshToken: "" }));
      toast.success("Disconnected from Google Calendar");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-8">
      {/* ── Header ── */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Customize your Productivity Nexus experience
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="rounded-xl border border-border bg-transparent px-4 py-2 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className={`relative flex items-center gap-2 rounded-xl border px-5 py-2 text-sm font-medium transition-all ${
              isDirty
                ? "border-primary/40 bg-primary/15 text-primary hover:bg-primary/25"
                : "border-border bg-transparent text-muted-foreground opacity-60 cursor-not-allowed"
            } disabled:opacity-50`}
          >
            {saving ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border border-primary border-t-transparent" />
                Saving…
              </>
            ) : (
              <>
                {isDirty && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary" />
                )}
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-amber-400">
          <span className="text-sm">⚠️ Could not load settings — showing defaults. {error}</span>
          <button
            onClick={fetchSettings}
            className="rounded-lg border border-amber-500/20 px-3 py-1 text-xs hover:bg-amber-500/20"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Loading ── */}
      {loading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card/50 p-6 animate-pulse">
              <div className="mb-4 border-b border-border pb-4">
                <div className="h-4 w-32 rounded bg-white/10" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[...Array(2)].map((_, j) => (
                  <div key={j} className="space-y-1.5">
                    <div className="h-3 w-20 rounded bg-white/10" />
                    <div className="h-9 w-32 rounded-xl bg-white/10" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Username / Profile ── */}
          <Section
            title="Your Profile"
            description="Your @username is how family members assign tasks to you on the Family Board"
          >
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Username</label>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 flex-1 rounded-xl border px-4 py-2.5 transition-colors ${
                    usernameStatus === "available" ? "border-emerald-500/50 bg-emerald-500/5"
                    : usernameStatus === "taken" ? "border-red-500/50 bg-red-500/5"
                    : usernameStatus === "invalid" ? "border-yellow-500/50 bg-yellow-500/5"
                    : "border-border bg-card/30"
                  }`}>
                    <span className="text-white/40 font-bold text-sm">@</span>
                    <input
                      value={usernameInput}
                      onChange={e => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      placeholder="your_username"
                      maxLength={20}
                      className="flex-1 bg-transparent text-sm text-white placeholder-white/20 outline-none"
                    />
                    {usernameStatus === "checking" && <span className="text-[10px] text-white/30">Checking...</span>}
                    {usernameStatus === "available" && <span className="text-[10px] text-emerald-400 font-bold">✓ Available</span>}
                    {usernameStatus === "taken" && <span className="text-[10px] text-red-400 font-bold">✗ Taken</span>}
                    {usernameStatus === "invalid" && <span className="text-[10px] text-yellow-400">3+ chars</span>}
                  </div>
                  <button
                    disabled={usernameStatus !== "available" || saving}
                    onClick={async () => {
                      setSaving(true);
                      try {
                        const res = await fetch("/api/settings", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ username: usernameInput }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error);
                        setSettings(prev => ({ ...prev, username: usernameInput }));
                        setUsernameStatus("idle");
                        toast.success(`Username set to @${usernameInput}!`);
                      } catch(e: any) {
                        toast.error(e.message);
                      } finally { setSaving(false); }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors shrink-0"
                  >
                    Set
                  </button>
                </div>
                {settings.username && (
                  <p className="mt-1.5 text-xs text-white/40">Current: <span className="text-violet-400 font-medium">@{settings.username}</span></p>
                )}
                <p className="mt-1 text-xs text-white/25">3-20 characters, letters, numbers, underscores only.</p>
              </div>
            </div>
          </Section>

          {/* ── Workday Hours ──*/}
          <Section
            title="Workday Hours"
            description="Define your working hours for scheduling and focus blocks"
          >
            <div className="flex flex-wrap gap-6">
              <TimeField
                label="Start Time"
                value={settings.workdayStart}
                onChange={(v) => update("workdayStart", v)}
                hint="When your workday begins"
              />
              <TimeField
                label="End Time"
                value={settings.workdayEnd}
                onChange={(v) => update("workdayEnd", v)}
                hint="When your workday ends"
              />
            </div>
          </Section>

          {/* ── Quiet Hours ── */}
          <Section
            title="Quiet Hours"
            description="Suppress notifications during these hours"
          >
            <div className="flex flex-wrap gap-6">
              <TimeField
                label="Quiet Hours Start"
                value={settings.quietHoursStart}
                onChange={(v) => update("quietHoursStart", v)}
                hint="Notifications pause at this time"
              />
              <TimeField
                label="Quiet Hours End"
                value={settings.quietHoursEnd}
                onChange={(v) => update("quietHoursEnd", v)}
                hint="Notifications resume at this time"
              />
            </div>

            {/* Visual preview */}
            <div className="mt-4 rounded-xl border border-border/50 bg-background/20 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                🔕 Notifications will be silenced from{" "}
                <span className="font-medium text-foreground">{settings.quietHoursStart}</span> to{" "}
                <span className="font-medium text-foreground">{settings.quietHoursEnd}</span>
              </p>
            </div>
          </Section>

          {/* ── Preferences ── */}
          <Section
            title="Preferences"
            description="Toggle features and notification behaviors"
          >
            <div className="space-y-3">
              <Toggle
                label="Focus Mode"
                description="Block distracting notifications during focus sessions"
                checked={settings.focusModeEnabled}
                onChange={(v) => update("focusModeEnabled", v)}
              />
              <Toggle
                label="Hourly Updates"
                description="Receive a brief digest of your schedule every hour"
                checked={settings.hourlyUpdatesEnabled}
                onChange={(v) => update("hourlyUpdatesEnabled", v)}
              />
            </div>
          </Section>

          {/* ── Timezone ── */}
          <Section
            title="Timezone"
            description="Affects how events and tasks are displayed and scheduled"
          >
            <div className="max-w-sm">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Timezone
              </label>
              <input
                type="text"
                value={settings.timezone}
                onChange={(e) => update("timezone", e.target.value)}
                placeholder="e.g. America/New_York"
                className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              <p className="mt-1.5 text-[10px] text-muted-foreground/60">
                Detected: {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </p>
            </div>

            {/* Common timezones */}
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                "UTC",
                "America/New_York",
                "America/Los_Angeles",
                "Europe/London",
                "Europe/Berlin",
                "Asia/Tokyo",
                "Asia/Kolkata",
              ].map((tz) => (
                <button
                  key={tz}
                  onClick={() => update("timezone", tz)}
                  className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                    settings.timezone === tz
                      ? "border-primary/30 bg-primary/15 text-primary"
                      : "border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  {tz}
                </button>
              ))}
            </div>
          </Section>

          {/* ── AI Configuration ── */}
          <Section
            title="AI Configuration"
            description="Your personal Gemini API key powers Restia, your AI Chief of Staff"
          >
            <div className="max-w-md">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-muted-foreground">
                  Gemini API Key
                </label>
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-primary hover:underline"
                >
                  Get your free key →
                </a>
              </div>
              <input
                type="password"
                value={settings.geminiApiKey}
                onChange={(e) => update("geminiApiKey", e.target.value)}
                placeholder="AIzaSy..."
                className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              <p className="mt-1.5 text-[10px] text-muted-foreground/60">
                Required for AI assistant, Telegram bot, hourly updates, and text-to-speech.
              </p>
              {!settings.geminiApiKey && (
                <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-400">
                  ⚠️ No API key set — AI features are currently disabled.
                </div>
              )}
            </div>
          </Section>

          {/* ── Integrations ── */}
          <Section
            title="Integrations & Notifications"
            description="Configure external services to receive scheduled pings"
          >
            <div className="space-y-4 max-w-md">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-muted-foreground">
                    Discord Webhook URL
                  </label>
                  <button 
                    onClick={() => handleTest("discord")}
                    disabled={testing === "discord" || !settings.discordWebhookUrl}
                    className="text-[10px] text-primary hover:underline disabled:opacity-50 disabled:no-underline"
                  >
                    {testing === "discord" ? "Testing..." : "Test Connection"}
                  </button>
                </div>
                <input
                  type="text"
                  value={settings.discordWebhookUrl}
                  onChange={(e) => update("discordWebhookUrl", e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>

              <div className="pt-2 border-t border-border/50">
                <div className="flex items-center justify-between mb-1 mt-2">
                  <label className="block text-xs font-medium text-muted-foreground">
                    Telegram Bot Token
                  </label>
                  <button 
                    onClick={() => handleTest("telegram")}
                    disabled={testing === "telegram" || !settings.telegramBotToken}
                    className="text-[10px] text-primary hover:underline disabled:opacity-50 disabled:no-underline"
                  >
                    {testing === "telegram" ? "Registering & Testing..." : "Set Webhook & Test"}
                  </button>
                </div>
                <input
                  type="text"
                  value={settings.telegramBotToken}
                  onChange={(e) => update("telegramBotToken", e.target.value)}
                  placeholder="123456789:ABCdef..."
                  className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 mb-3"
                />
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Telegram Chat ID
                </label>
                <input
                  type="text"
                  value={settings.telegramChatId}
                  onChange={(e) => update("telegramChatId", e.target.value)}
                  placeholder="Your chat ID..."
                  className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>
          </Section>

          {/* ── Google Calendar ── */}
          <Section
            title="Google Calendar"
            description="Sync tasks and events with your Google account"
          >
            <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/20 max-w-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 p-2">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 5.5H3V19C3 19.55 3.45 20 4 20H20C20.55 20 21 19.55 21 19V5.5Z" fill="#F4B400"/>
                    <path d="M21 5.5H3V11H21V5.5Z" fill="#4285F4"/>
                    <path d="M21 5.5H3V8.5H21V5.5Z" fill="#DB4437"/>
                    <path d="M15 8.5H3V5.5C3 4.95 3.45 4.5 4 4.5H20C20.55 4.5 21 4.95 21 5.5V8.5H15Z" fill="#0F9D58"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Google Calendar</p>
                  <p className="text-xs text-muted-foreground">
                    {settings.googleAccessToken ? "Connected and syncing" : "Not connected"}
                  </p>
                </div>
              </div>
              
              {settings.googleAccessToken ? (
                <button
                  onClick={handleDisconnectGoogle}
                  className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/20 transition-colors"
                >
                  Disconnect
                </button>
              ) : (
                <a
                  href="/api/auth/google"
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Connect Google
                </a>
              )}
            </div>
          </Section>

          {/* ── Summary card ── */}
          <div className="rounded-2xl border border-border/30 bg-card/30 p-5 backdrop-blur">
            <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Current Configuration
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-sm sm:grid-cols-3">
              {[
                { label: "Workday", value: `${settings.workdayStart} – ${settings.workdayEnd}` },
                { label: "Quiet Hours", value: `${settings.quietHoursStart} – ${settings.quietHoursEnd}` },
                { label: "Timezone", value: settings.timezone },
                { label: "Focus Mode", value: settings.focusModeEnabled ? "On ✓" : "Off" },
                { label: "Hourly Updates", value: settings.hourlyUpdatesEnabled ? "On ✓" : "Off" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom save bar (sticky) ── */}
      {isDirty && !loading && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/90 px-5 py-3 shadow-2xl backdrop-blur-xl">
            <span className="text-sm text-muted-foreground">You have unsaved changes</span>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl border border-primary/40 bg-primary/20 px-4 py-1.5 text-sm font-medium text-primary hover:bg-primary/30 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save now"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
