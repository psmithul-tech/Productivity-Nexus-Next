import Link from "next/link";
import {
  Zap, Shield, Brain, Globe, Wallet, HeartPulse, GraduationCap,
  Home, Briefcase, ChevronRight, Sparkles, Lock, ArrowRight,
  CheckSquare, Calendar, Bell, Timer, BarChart3, Users,
  Star, TrendingUp, Cpu
} from "lucide-react";

export const metadata = {
  title: "Restia | Your Personal AI Operating System",
  description: "Restia is your Jarvis-like personal AI operating system. Modular, intelligent, and designed to run every aspect of your life — from productivity to finance, health, and beyond.",
};

const MODULES = [
  {
    id: "chief-of-staff",
    name: "Chief of Staff",
    tagline: "Productivity & Task Intelligence",
    description: "AI-powered task management, calendar sync, smart reminders, focus sessions, habit tracking, family board, and weekly reviews.",
    icon: Briefcase,
    gradient: "from-violet-500 to-purple-600",
    glow: "violet",
    status: "live" as const,
    features: ["Tasks & Priorities", "Calendar Sync", "AI Assistant", "Focus Timer", "Habits", "Family Board", "Analytics"],
    href: "/login",
  },
  {
    id: "vault",
    name: "Vault",
    tagline: "Personal Finance & Budgeting",
    description: "Track expenses, manage budgets, visualize spending patterns, and get AI-driven financial insights.",
    icon: Wallet,
    gradient: "from-emerald-500 to-green-600",
    glow: "emerald",
    status: "coming" as const,
    features: ["Expense Tracking", "Budget Goals", "Investment View", "AI Insights"],
    href: "#",
  },
  {
    id: "pulse",
    name: "Pulse",
    tagline: "Health & Wellness Tracker",
    description: "Monitor sleep, nutrition, workouts, and mental wellness with intelligent health correlations.",
    icon: HeartPulse,
    gradient: "from-rose-500 to-pink-600",
    glow: "rose",
    status: "coming" as const,
    features: ["Sleep Tracking", "Workout Log", "Nutrition", "Mood Journal"],
    href: "#",
  },
  {
    id: "atlas",
    name: "Atlas",
    tagline: "Learning & Knowledge Base",
    description: "Capture notes, build a personal wiki, track courses, and let AI connect your knowledge dots.",
    icon: GraduationCap,
    gradient: "from-blue-500 to-cyan-600",
    glow: "blue",
    status: "coming" as const,
    features: ["Smart Notes", "Course Tracker", "Knowledge Graph", "Flashcards"],
    href: "#",
  },
  {
    id: "nest",
    name: "Nest",
    tagline: "Home & Life Management",
    description: "Grocery lists, meal planning, home maintenance schedules, and household coordination.",
    icon: Home,
    gradient: "from-amber-500 to-orange-600",
    glow: "amber",
    status: "coming" as const,
    features: ["Grocery Lists", "Meal Planner", "Home Tasks", "Shared Lists"],
    href: "#",
  },
  {
    id: "sentinel",
    name: "Sentinel",
    tagline: "Digital Security & Passwords",
    description: "Password vault, breach monitoring, 2FA management, and security health scoring.",
    icon: Shield,
    gradient: "from-slate-400 to-zinc-500",
    glow: "slate",
    status: "coming" as const,
    features: ["Password Vault", "Breach Alerts", "2FA Manager", "Security Score"],
    href: "#",
  },
];

function StatusBadge({ status }: { status: "live" | "coming" }) {
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Live
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/40 text-[11px] font-bold uppercase tracking-wider">
      <Lock className="h-2.5 w-2.5" />
      Coming Soon
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#06060e] text-white overflow-x-hidden">
      {/* ── Ambient glow blobs ── */}
      <div className="fixed top-[-20%] left-[-10%] h-[800px] w-[800px] rounded-full bg-violet-600/8 blur-[180px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] h-[800px] w-[800px] rounded-full bg-blue-600/8 blur-[180px] pointer-events-none" />
      <div className="fixed top-[40%] right-[20%] h-[400px] w-[400px] rounded-full bg-rose-600/5 blur-[150px] pointer-events-none" />

      {/* ── Header ── */}
      <header className="relative z-20 py-5 px-4 sm:px-8 max-w-7xl mx-auto w-full flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Cpu className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight">Restia</span>
            <span className="hidden sm:inline text-[10px] font-bold text-white/30 uppercase tracking-widest ml-2">OS</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-semibold hover:bg-white/10 hover:text-white transition-all"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold hover:shadow-lg hover:shadow-violet-500/25 hover:scale-[1.02] transition-all"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative z-10 text-center px-4 sm:px-8 pt-16 sm:pt-24 pb-20 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/50 uppercase tracking-wider mb-8">
          <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          Personal AI Operating System
        </div>

        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[0.95] mb-8">
          <span className="block">Your life,</span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400">orchestrated.</span>
        </h1>

        <p className="text-lg sm:text-xl text-white/40 max-w-2xl mx-auto leading-relaxed mb-12">
          Restia is a modular AI operating system designed to manage every dimension of your life.
          Each module is an intelligent agent — think Jarvis, but built for the real world.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Link
            href="/login"
            className="group flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-black font-bold text-base hover:scale-[1.03] transition-all shadow-xl shadow-white/10"
          >
            Launch Restia
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <a
            href="#modules"
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-semibold text-base hover:text-white hover:bg-white/10 transition-all"
          >
            Explore Modules
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap justify-center gap-8 sm:gap-16 text-center">
          {[
            { value: "6", label: "Modules", sub: "1 Live" },
            { value: "∞", label: "Automations", sub: "AI-Powered" },
            { value: "24/7", label: "Always On", sub: "Background Agents" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl sm:text-4xl font-black text-white">{stat.value}</p>
              <p className="text-xs font-bold text-white/30 uppercase tracking-wider mt-1">{stat.label}</p>
              <p className="text-[10px] text-violet-400/60 font-medium mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Modules Grid ── */}
      <section id="modules" className="relative z-10 px-4 sm:px-8 pb-24 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Modular by <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">Design</span>
          </h2>
          <p className="text-white/40 max-w-2xl mx-auto">
            Each module is a self-contained AI agent that manages one domain of your life.
            Activate what you need, when you need it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            const isLive = mod.status === "live";
            return (
              <div
                key={mod.id}
                className={`group relative rounded-3xl border p-6 transition-all duration-300 ${
                  isLive
                    ? "border-violet-500/30 bg-violet-500/[0.04] hover:border-violet-500/50 hover:bg-violet-500/[0.08] hover:shadow-2xl hover:shadow-violet-500/10"
                    : "border-white/[0.06] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                }`}
              >
                {/* Glow for live module */}
                {isLive && (
                  <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-violet-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                )}

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-5">
                    <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center shadow-lg ${isLive ? `shadow-${mod.glow}-500/20` : ""}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <StatusBadge status={mod.status} />
                  </div>

                  <h3 className="text-lg font-black text-white mb-1">{mod.name}</h3>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${isLive ? "text-violet-400" : "text-white/30"}`}>
                    {mod.tagline}
                  </p>
                  <p className="text-sm text-white/40 leading-relaxed mb-5">
                    {mod.description}
                  </p>

                  {/* Feature pills */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {mod.features.map((f) => (
                      <span
                        key={f}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          isLive
                            ? "bg-violet-500/10 text-violet-300/80 border border-violet-500/15"
                            : "bg-white/5 text-white/25 border border-white/5"
                        }`}
                      >
                        {f}
                      </span>
                    ))}
                  </div>

                  {isLive ? (
                    <Link
                      href={mod.href}
                      className="flex items-center gap-2 text-sm font-bold text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      Open Module <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <p className="text-xs text-white/20 font-medium">
                      Notify me when available →
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Architecture Section ── */}
      <section className="relative z-10 px-4 sm:px-8 pb-24 max-w-5xl mx-auto">
        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 sm:p-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center border border-violet-500/20">
              <Brain className="h-5 w-5 text-violet-400" />
            </div>
            <h2 className="text-2xl font-black text-white">How Restia Works</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Modular Agents",
                desc: "Each module runs as an independent AI agent with its own data, logic, and intelligence layer.",
                icon: Cpu,
              },
              {
                step: "02",
                title: "Unified Core",
                desc: "All modules share a common identity, notification system, and AI backbone — seamlessly connected.",
                icon: Globe,
              },
              {
                step: "03",
                title: "Always Learning",
                desc: "Restia learns your patterns, preferences, and rhythms to proactively help before you ask.",
                icon: TrendingUp,
              },
            ].map((item) => {
              const StepIcon = item.icon;
              return (
                <div key={item.step} className="text-center sm:text-left">
                  <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-white/5 border border-white/10 mb-4">
                    <StepIcon className="h-5 w-5 text-violet-400" />
                  </div>
                  <p className="text-[10px] font-black text-violet-400/50 uppercase tracking-widest mb-1">Step {item.step}</p>
                  <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-white/35 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Privacy & Data Transparency ── */}
      <section className="relative z-10 px-4 sm:px-8 pb-24 max-w-5xl mx-auto">
        <div className="rounded-3xl border border-indigo-500/20 bg-indigo-500/[0.03] p-8 sm:p-12">
          <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-3">
            <Shield className="h-6 w-6 text-indigo-400" />
            Data Transparency & Privacy
          </h2>
          <p className="text-white/40 mb-6">
            Restia prioritizes your privacy. We explicitly request access to your Google Calendar to provide core functionality:
          </p>
          <ul className="space-y-3 text-sm text-white/40 mb-6">
            {[
              "Syncing your upcoming events directly into your Restia dashboard.",
              "Allowing the AI Assistant to view your schedule and help you plan your week.",
              "Triggering smart reminders based on your calendar events.",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckSquare className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-white/25">
            We only request the minimum permissions required. Your data is securely stored, never sold, and only used to enhance your experience.
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 text-center px-4 sm:px-8 pb-24 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-bold text-violet-400 uppercase tracking-wider mb-6">
          <Star className="h-3 w-3" /> Free to use during beta
        </div>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
          Ready to meet your <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">personal AI?</span>
        </h2>
        <p className="text-white/40 mb-8 max-w-xl mx-auto">
          Start with Chief of Staff today. More modules shipping soon.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl bg-white text-black font-bold text-lg hover:scale-[1.03] transition-all shadow-2xl shadow-white/10"
        >
          Launch Restia <Zap className="h-5 w-5" />
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.06] py-10 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
              <Cpu className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white/50">Restia OS</span>
          </div>
          <div className="flex gap-6 text-sm text-white/30">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
          <p className="text-xs text-white/20">© 2026 Restia. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
