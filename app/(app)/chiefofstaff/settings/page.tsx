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
  telegramUsername: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  geminiApiKey: string;
  openrouterApiKey: string;
  username: string;
  pingFrequency: number;
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
  telegramUsername: "",
  geminiApiKey: "",
  openrouterApiKey: "",
  username: "",
  pingFrequency: 30,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="relative inline-block w-12 align-middle select-none transition duration-200 ease-in">
      <input 
        type="checkbox" 
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={"absolute block w-6 h-6 rounded bg-white dark:bg-surface border-[3px] border-black dark:border-outline-variant/50 appearance-none cursor-pointer z-10 transition-all top-[2px] shadow-[0_2px_0_0_#000] dark:shadow-none " + (checked ? "right-[2px]" : "right-[26px]")}
      />
      <div 
        className={"block overflow-hidden h-7 rounded border-[3px] border-black dark:border-outline-variant/50 cursor-pointer transition-colors shadow-[0_2px_0_0_#000] dark:shadow-none " + (checked ? "bg-[#06D6A0] dark:bg-primary" : "bg-gray-300 dark:bg-surface-container-high")}
        onClick={() => onChange(!checked)}
      ></div>
    </div>
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
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    const success = params.get("success");
    if (err) toast.error("Google Auth Failed", { description: err.replace(/_/g, " ") });
    if (success === "google_connected") toast.success("Google Calendar connected successfully!");
    if (err || success) window.history.replaceState({}, document.title, window.location.pathname);
  }, []);

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
      toast.success("Settings saved successfully");
    } catch (e) {
      toast.error("Failed to save settings", { description: (e as Error).message });
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
    <div className="flex-1 overflow-y-auto page-enter px-4 md:px-8 py-8 custom-scrollbar">
      <div className="max-w-container-max mx-auto flex flex-col gap-8 md:gap-12">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
          <header className="flex flex-col gap-3">
            <h1 className="text-[28px] font-heading font-black text-black dark:text-on-surface uppercase tracking-widest flex items-center gap-3 drop-shadow-[0_2px_0_rgba(0,0,0,0.1)] dark:drop-shadow-none">
              <div className="w-10 h-10 rounded-xl bg-[#FFD166] dark:bg-surface-container flex items-center justify-center border-[2px] border-black dark:border-outline-variant/30 shadow-[0_2px_0_0_#000] dark:shadow-none shrink-0">
                <span className="material-symbols-outlined text-black dark:text-primary text-[20px]">settings</span>
              </div>
              System Configuration
            </h1>
            <p className="text-black dark:text-on-surface-variant font-bold">
              Manage global integrations, synchronization parameters, and ambient environment settings.
            </p>
          </header>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setSettings(DEFAULTS); setIsDirty(true); }}
              className="text-black dark:text-on-surface font-black uppercase tracking-widest text-[10px] border-b-[2px] border-black dark:border-on-surface hover:bg-gray-100 dark:hover:bg-surface-container transition-colors pb-0.5 px-1"
            >
              Reset to Defaults
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className={"h-[48px] px-6 rounded-xl font-black uppercase tracking-widest text-[12px] border-[2px] border-black dark:border-transparent transition-all flex items-center justify-center gap-2 min-w-[140px] " + (
                isDirty
                  ? "bg-[#3E85E4] dark:bg-primary text-white dark:text-on-primary shadow-[0_4px_0_0_#000] dark:shadow-sm hover:translate-y-1 hover:shadow-[0_2px_0_0_#000] dark:hover:shadow-md"
                  : "bg-gray-300 dark:bg-surface-container-high text-gray-500 dark:text-on-surface-variant opacity-50 cursor-not-allowed shadow-[0_2px_0_0_#000] dark:shadow-none"
              )}
            >
              {saving ? <span className="material-symbols-outlined animate-spin text-[16px]">sync</span> : <span className="material-symbols-outlined text-[16px]">save</span>}
              Deploy Config
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-[#EF476F] dark:bg-error border-[3px] border-black dark:border-transparent rounded-xl p-4 flex items-center justify-between text-white dark:text-on-error font-black uppercase tracking-widest text-sm mb-4 shadow-[4px_4px_0_0_#000] dark:shadow-sm">
            <span>{error}</span>
            <button onClick={fetchSettings} className="border-[2px] border-black dark:border-transparent bg-white dark:bg-error-container text-black dark:text-on-error-container px-3 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-error-container/80 transition-colors shadow-[0_2px_0_0_#000] dark:shadow-none hover:translate-y-1 hover:shadow-none">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="p-12 flex justify-center text-primary">
            <span className="material-symbols-outlined animate-spin text-[32px]">sync</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column (8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              
              {/* Integrations */}
              <div className="bg-white dark:bg-surface border-[3px] border-black dark:border-outline-variant/20 rounded-[32px] p-6 lg:p-8 shadow-[8px_8px_0_0_#000] dark:shadow-sm">
                <h2 className="font-heading text-xl font-black text-black dark:text-on-surface uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-black dark:text-primary text-xl">cable</span>
                  External Integrations
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Discord */}
                  <div className="bg-gray-100 dark:bg-surface-container border-[3px] border-black dark:border-transparent rounded-[24px] p-4 flex flex-col justify-between h-full group hover:-translate-y-1 transition-transform shadow-[0_4px_0_0_#000] dark:shadow-none hover:shadow-[0_2px_0_0_#000] dark:hover:shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#5865F2] border-[2px] border-black dark:border-transparent flex items-center justify-center shadow-[0_2px_0_0_#000] dark:shadow-none">
                          <span className="material-symbols-outlined text-white">forum</span>
                        </div>
                        <div>
                          <h3 className="font-heading text-sm font-black text-black dark:text-on-surface uppercase tracking-widest">Discord Webhook</h3>
                          <p className="font-bold text-[10px] uppercase text-gray-500 dark:text-on-surface-variant">Alerts & Logging</p>
                        </div>
                      </div>
                      <div className={"flex items-center gap-1.5 px-2 py-1 rounded-md border-[2px] border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-none " + (settings.discordWebhookUrl ? "bg-[#06D6A0] dark:bg-primary" : "bg-white dark:bg-surface")}>
                        <span className={"w-2 h-2 rounded-full border-[1px] border-black dark:border-transparent " + (settings.discordWebhookUrl ? "bg-white dark:bg-on-primary animate-pulse" : "bg-gray-300 dark:bg-surface-container-highest")}></span>
                        <span className={"font-bold text-[10px] uppercase tracking-widest " + (settings.discordWebhookUrl ? "text-black dark:text-on-primary" : "text-gray-400 dark:text-on-surface-variant")}>
                          {settings.discordWebhookUrl ? 'Configured' : 'Offline'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 mt-auto pt-4 border-t-[3px] border-black dark:border-outline-variant/20">
                      <input
                        type="password"
                        value={settings.discordWebhookUrl}
                        onChange={e => update("discordWebhookUrl", e.target.value)}
                        placeholder="Webhook URL..."
                        className="bg-white dark:bg-surface border-[2px] border-black dark:border-outline-variant/30 rounded-xl px-4 h-[40px] text-[13px] w-full focus:outline-none shadow-inner dark:shadow-none dark:text-on-surface"
                      />
                      <div className="flex justify-end">
                        <button 
                          onClick={() => handleTest("discord")} 
                          disabled={!settings.discordWebhookUrl || testing === "discord"}
                          className="font-black uppercase tracking-widest text-black dark:text-primary hover:text-[#3E85E4] dark:hover:text-primary/80 transition-colors text-[10px] disabled:opacity-50"
                        >
                          {testing === "discord" ? "Testing..." : "Test Connection"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Telegram */}
                  <div className="bg-gray-100 dark:bg-surface-container border-[3px] border-black dark:border-transparent rounded-[24px] p-4 flex flex-col justify-between h-full group hover:-translate-y-1 transition-transform shadow-[0_4px_0_0_#000] dark:shadow-none hover:shadow-[0_2px_0_0_#000] dark:hover:shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#2AABEE] border-[2px] border-black dark:border-transparent flex items-center justify-center shadow-[0_2px_0_0_#000] dark:shadow-none">
                          <span className="material-symbols-outlined text-white">send</span>
                        </div>
                        <div>
                          <h3 className="font-heading text-sm font-black text-black dark:text-on-surface uppercase tracking-widest">Telegram Bot</h3>
                          <p className="font-bold text-[10px] uppercase text-gray-500 dark:text-on-surface-variant">Direct Commands</p>
                        </div>
                      </div>
                      <div className={"flex items-center gap-1.5 px-2 py-1 rounded-md border-[2px] border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-none " + (settings.telegramBotToken ? "bg-[#06D6A0] dark:bg-primary" : "bg-white dark:bg-surface")}>
                        <span className={"w-2 h-2 rounded-full border-[1px] border-black dark:border-transparent " + (settings.telegramBotToken ? "bg-white dark:bg-on-primary animate-pulse" : "bg-gray-300 dark:bg-surface-container-highest")}></span>
                        <span className={"font-bold text-[10px] uppercase tracking-widest " + (settings.telegramBotToken ? "text-black dark:text-on-primary" : "text-gray-400 dark:text-on-surface-variant")}>
                          {settings.telegramBotToken ? 'Configured' : 'Offline'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 mt-auto pt-4 border-t-[3px] border-black dark:border-outline-variant/20">
                      <input
                        type="password"
                        value={settings.telegramBotToken}
                        onChange={e => update("telegramBotToken", e.target.value)}
                        placeholder="Bot Token..."
                        className="bg-white dark:bg-surface border-[2px] border-black dark:border-outline-variant/30 rounded-xl px-4 h-[40px] text-[13px] w-full focus:outline-none shadow-inner dark:shadow-none dark:text-on-surface"
                      />
                      <input
                        type="text"
                        value={settings.telegramChatId}
                        onChange={e => update("telegramChatId", e.target.value)}
                        placeholder="Chat ID..."
                        className="bg-white dark:bg-surface border-[2px] border-black dark:border-outline-variant/30 rounded-xl px-4 h-[40px] text-[13px] w-full focus:outline-none shadow-inner dark:shadow-none dark:text-on-surface"
                      />
                      <input
                        type="text"
                        value={settings.telegramUsername}
                        onChange={e => update("telegramUsername", e.target.value)}
                        placeholder="Username (optional)..."
                        className="bg-white dark:bg-surface border-[2px] border-black dark:border-outline-variant/30 rounded-xl px-4 h-[40px] text-[13px] w-full focus:outline-none shadow-inner dark:shadow-none dark:text-on-surface"
                      />
                      <div className="flex justify-end mt-1">
                        <button 
                          onClick={() => handleTest("telegram")} 
                          disabled={!settings.telegramBotToken || testing === "telegram"}
                          className="font-black uppercase tracking-widest text-black dark:text-primary hover:text-[#3E85E4] dark:hover:text-primary/80 transition-colors text-[10px] disabled:opacity-50"
                        >
                          {testing === "telegram" ? "Testing..." : "Test Connection"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Google Calendar */}
                  <div className="bg-gray-100 dark:bg-surface-container border-[3px] border-black dark:border-transparent rounded-[24px] p-4 flex flex-col justify-between h-full group hover:-translate-y-1 transition-transform md:col-span-2 shadow-[0_4px_0_0_#000] dark:shadow-none hover:shadow-[0_2px_0_0_#000] dark:hover:shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#4285F4] border-[2px] border-black dark:border-transparent flex items-center justify-center shadow-[0_2px_0_0_#000] dark:shadow-none">
                          <span className="material-symbols-outlined text-white">calendar_month</span>
                        </div>
                        <div>
                          <h3 className="font-heading text-sm font-black text-black dark:text-on-surface uppercase tracking-widest">Google Calendar</h3>
                          <p className="font-bold text-[10px] uppercase text-gray-500 dark:text-on-surface-variant">Schedule Sync</p>
                        </div>
                      </div>
                      <div className={"flex items-center gap-1.5 px-2 py-1 rounded-md border-[2px] border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-none " + (settings.googleAccessToken ? "bg-[#06D6A0] dark:bg-primary" : "bg-white dark:bg-surface")}>
                        <span className={"w-2 h-2 rounded-full border-[1px] border-black dark:border-transparent " + (settings.googleAccessToken ? "bg-white dark:bg-on-primary" : "bg-gray-300 dark:bg-surface-container-highest")}></span>
                        <span className={"font-bold text-[10px] uppercase tracking-widest " + (settings.googleAccessToken ? "text-black dark:text-on-primary" : "text-gray-400 dark:text-on-surface-variant")}>
                          {settings.googleAccessToken ? 'Syncing' : 'Offline'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end mt-auto pt-4 border-t-[3px] border-black dark:border-outline-variant/20">
                      {settings.googleAccessToken ? (
                        <button onClick={handleDisconnectGoogle} className="font-black text-[10px] uppercase tracking-widest bg-[#EF476F] dark:bg-error text-white dark:text-on-error border-[2px] border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-sm hover:translate-y-[2px] hover:shadow-none transition-all px-4 py-2 rounded-xl">Disconnect</button>
                      ) : (
                        <a href="/api/auth/google" className="font-black text-[10px] uppercase tracking-widest bg-white dark:bg-primary text-black dark:text-on-primary border-[2px] border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-sm hover:translate-y-[2px] hover:shadow-none transition-all px-4 py-2 rounded-xl">Connect Google</a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile & System Keys */}
              {/* Profile & System Keys */}
              <div className="bg-white dark:bg-surface border-[3px] border-black dark:border-outline-variant/20 rounded-[32px] p-6 lg:p-8 shadow-[8px_8px_0_0_#000] dark:shadow-sm">
                <h2 className="font-heading text-xl font-black text-black dark:text-on-surface uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-black dark:text-primary text-xl">vpn_key</span>
                  System Credentials
                </h2>
                
                <div className="space-y-6">
                  {/* Username */}
                  <div>
                    <label className="mb-2 block font-heading text-[10px] uppercase font-black tracking-widest text-black dark:text-on-surface">Operating Alias (Username)</label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-on-surface-variant font-bold">@</span>
                        <input
                          value={usernameInput}
                          onChange={e => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                          className="w-full bg-white dark:bg-surface-container border-[2px] border-black dark:border-outline-variant/30 rounded-xl pl-8 pr-4 h-[48px] font-bold text-[15px] text-black dark:text-on-surface focus:outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-none focus:border-[#FFD166] dark:focus:border-primary focus:ring-2 focus:ring-[#FFD166]/20 transition-all"
                        />
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
                        className="px-4 py-2 h-[48px] rounded-xl bg-[#06D6A0] dark:bg-primary border-[2px] border-black dark:border-transparent text-black dark:text-on-primary font-black uppercase tracking-widest hover:translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0 shadow-[0_4px_0_0_#000] dark:shadow-sm hover:shadow-[0_2px_0_0_#000] dark:hover:shadow-md disabled:shadow-none"
                      >
                        Set
                      </button>
                    </div>
                    {usernameStatus === "available" && <p className="mt-1 text-xs text-[#06D6A0] font-bold">Available</p>}
                    {usernameStatus === "taken" && <p className="mt-1 text-xs text-[#EF476F] font-bold">Taken</p>}
                  </div>

                  {/* Gemini Key */}
                  <div>
                    <label className="mb-2 block font-heading text-[10px] uppercase font-black tracking-widest text-black dark:text-on-surface">Gemini API Key</label>
                    <input
                      type="password"
                      value={settings.geminiApiKey}
                      onChange={e => update("geminiApiKey", e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-white dark:bg-surface-container border-[2px] border-black dark:border-outline-variant/30 rounded-xl px-4 h-[48px] font-bold text-[15px] text-black dark:text-on-surface focus:outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-none focus:border-[#FFD166] dark:focus:border-primary focus:ring-2 focus:ring-[#FFD166]/20 transition-all"
                    />
                  </div>

                  {/* OpenRouter Key */}
                  <div>
                    <label className="mb-2 block font-heading text-[10px] uppercase font-black tracking-widest text-black dark:text-on-surface">OpenRouter API Key</label>
                    <input
                      type="password"
                      value={settings.openrouterApiKey}
                      onChange={e => update("openrouterApiKey", e.target.value)}
                      placeholder="sk-or-v1-..."
                      className="w-full bg-white dark:bg-surface-container border-[2px] border-black dark:border-outline-variant/30 rounded-xl px-4 h-[48px] font-bold text-[15px] text-black dark:text-on-surface focus:outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-none focus:border-[#FFD166] dark:focus:border-primary focus:ring-2 focus:ring-[#FFD166]/20 transition-all"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-8">
              
              {/* Alert Routing */}
              <div className="bg-[#9D4EDD] dark:bg-surface border-[3px] border-black dark:border-outline-variant/20 rounded-[32px] p-6 shadow-[8px_8px_0_0_#000] dark:shadow-sm">
                <h2 className="font-heading text-xl font-black text-white dark:text-[#9D4EDD] uppercase tracking-widest mb-6 flex items-center gap-2 drop-shadow-[0_2px_0_#000] dark:drop-shadow-none">
                  <span className="material-symbols-outlined text-white dark:text-[#9D4EDD] text-xl">notifications_active</span>
                  Alert Routing
                </h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-white dark:bg-surface-container border-[2px] border-black dark:border-transparent p-4 rounded-xl shadow-[0_4px_0_0_#000] dark:shadow-none">
                    <div>
                      <p className="font-heading font-black text-[14px] uppercase text-black dark:text-on-surface tracking-widest">Focus Mode</p>
                      <p className="font-bold text-[10px] uppercase text-gray-500 dark:text-on-surface-variant">Suppress non-critical pings</p>
                    </div>
                    <Toggle checked={settings.focusModeEnabled} onChange={v => update("focusModeEnabled", v)} />
                  </div>
                  <div className="flex items-center justify-between bg-white dark:bg-surface-container border-[2px] border-black dark:border-transparent p-4 rounded-xl shadow-[0_4px_0_0_#000] dark:shadow-none">
                    <div>
                      <p className="font-heading font-black text-[14px] uppercase text-black dark:text-on-surface tracking-widest">Hourly Updates</p>
                      <p className="font-bold text-[10px] uppercase text-gray-500 dark:text-on-surface-variant">Schedule summaries</p>
                    </div>
                    <Toggle checked={settings.hourlyUpdatesEnabled} onChange={v => update("hourlyUpdatesEnabled", v)} />
                  </div>
                </div>
              </div>

              {/* Daemon Polling */}
              <div className="bg-[#3E85E4] dark:bg-surface border-[3px] border-black dark:border-outline-variant/20 rounded-[32px] p-6 shadow-[8px_8px_0_0_#000] dark:shadow-sm">
                <h2 className="font-heading text-xl font-black text-white dark:text-[#3E85E4] uppercase tracking-widest mb-6 flex items-center gap-2 drop-shadow-[0_2px_0_#000] dark:drop-shadow-none">
                  <span className="material-symbols-outlined text-white dark:text-[#3E85E4] text-xl">cloud_sync</span>
                  Daemon Polling
                </h2>
                <div className="mb-6 bg-white dark:bg-surface-container border-[2px] border-black dark:border-transparent p-4 rounded-xl shadow-[0_4px_0_0_#000] dark:shadow-none">
                  <div className="flex justify-between items-end mb-4">
                    <label className="font-heading font-black text-[12px] uppercase text-black dark:text-on-surface tracking-widest">Interval Frequency</label>
                    <span className="font-black text-[14px] text-[#EF476F] dark:text-primary">{settings.pingFrequency} min</span>
                  </div>
                  <input 
                    type="range" 
                    min="15" 
                    max="240" 
                    step="15"
                    value={settings.pingFrequency}
                    onChange={e => update("pingFrequency", parseInt(e.target.value))}
                    className="w-full accent-[#EF476F] dark:accent-primary"
                  />
                  <div className="flex justify-between mt-2 px-1">
                    <span className="font-bold text-[10px] uppercase text-gray-400 dark:text-on-surface-variant">15m</span>
                    <span className="font-bold text-[10px] uppercase text-gray-400 dark:text-on-surface-variant">4h</span>
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-surface-container border-[2px] border-black dark:border-transparent rounded-xl flex items-start gap-3 shadow-[0_2px_0_0_#000] dark:shadow-none">
                  <span className="material-symbols-outlined text-[#3E85E4] dark:text-primary text-sm mt-0.5">info</span>
                  <p className="font-bold text-[10px] uppercase text-black dark:text-on-surface leading-relaxed">Lower intervals increase API consumption. Current rate limits allow for a minimum of 15m safely.</p>
                </div>
              </div>

              {/* Ambient Environment */}
              <div className="bg-[#EF476F] dark:bg-surface border-[3px] border-black dark:border-outline-variant/20 rounded-[32px] p-6 shadow-[8px_8px_0_0_#000] dark:shadow-sm">
                <h2 className="font-heading text-xl font-black text-white dark:text-[#EF476F] uppercase tracking-widest mb-6 flex items-center gap-2 drop-shadow-[0_2px_0_#000] dark:drop-shadow-none">
                  <span className="material-symbols-outlined text-white dark:text-[#EF476F] text-xl">schedule</span>
                  Ambient Environment
                </h2>
                <div className="space-y-4 bg-white dark:bg-surface-container border-[2px] border-black dark:border-transparent p-4 rounded-xl shadow-[0_4px_0_0_#000] dark:shadow-none">
                  <div>
                    <label className="mb-2 block font-heading text-[10px] uppercase font-black tracking-widest text-black dark:text-on-surface">Workday Window</label>
                    <div className="flex gap-2">
                      <input type="time" value={settings.workdayStart} onChange={e => update("workdayStart", e.target.value)} className="w-full bg-white dark:bg-surface-container-high border-[2px] border-black dark:border-outline-variant/30 rounded-xl px-4 h-[40px] font-bold text-[13px] text-black dark:text-on-surface focus:outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-none focus:border-[#FFD166] dark:focus:border-primary transition-all" />
                      <input type="time" value={settings.workdayEnd} onChange={e => update("workdayEnd", e.target.value)} className="w-full bg-white dark:bg-surface-container-high border-[2px] border-black dark:border-outline-variant/30 rounded-xl px-4 h-[40px] font-bold text-[13px] text-black dark:text-on-surface focus:outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-none focus:border-[#FFD166] dark:focus:border-primary transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block font-heading text-[10px] uppercase font-black tracking-widest text-black dark:text-on-surface">Quiet Hours</label>
                    <div className="flex gap-2">
                      <input type="time" value={settings.quietHoursStart} onChange={e => update("quietHoursStart", e.target.value)} className="w-full bg-white dark:bg-surface-container-high border-[2px] border-black dark:border-outline-variant/30 rounded-xl px-4 h-[40px] font-bold text-[13px] text-black dark:text-on-surface focus:outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-none focus:border-[#FFD166] dark:focus:border-primary transition-all" />
                      <input type="time" value={settings.quietHoursEnd} onChange={e => update("quietHoursEnd", e.target.value)} className="w-full bg-white dark:bg-surface-container-high border-[2px] border-black dark:border-outline-variant/30 rounded-xl px-4 h-[40px] font-bold text-[13px] text-black dark:text-on-surface focus:outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-none focus:border-[#FFD166] dark:focus:border-primary transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block font-heading text-[10px] uppercase font-black tracking-widest text-black dark:text-on-surface">Timezone</label>
                    <input type="text" value={settings.timezone} onChange={e => update("timezone", e.target.value)} className="w-full bg-white dark:bg-surface-container-high border-[2px] border-black dark:border-outline-variant/30 rounded-xl px-4 h-[40px] font-bold text-[13px] text-black dark:text-on-surface focus:outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-none focus:border-[#FFD166] dark:focus:border-primary transition-all" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
