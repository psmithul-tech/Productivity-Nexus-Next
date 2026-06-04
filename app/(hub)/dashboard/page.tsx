"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Briefcase, Wallet, HeartPulse, GraduationCap, Home, Shield,
  Lock, ArrowRight, Cpu, Sparkles, CheckSquare, Calendar,
  Timer, Flame, BarChart3, Users, Bell, Award, Settings,
  Newspaper, Map
} from "lucide-react";

const MODULES = [
  {
    id: "chief-of-staff",
    name: "Chief of Staff",
    tagline: "Productivity & Task Intelligence",
    description: "AI-powered task management, calendar sync, smart reminders, focus sessions, habit tracking, family board, and weekly reviews.",
    icon: Briefcase,
    gradient: "from-violet-500 to-purple-600",
    shadow: "shadow-violet-500/20",
    status: "live" as const,
    features: [
      { label: "Dashboard", href: "/chiefofstaff/dashboard", icon: BarChart3 },
      { label: "Tasks", href: "/tasks", icon: CheckSquare },
      { label: "Calendar", href: "/calendar", icon: Calendar },
      { label: "AI Assistant", href: "/assistant", icon: Sparkles },
      { label: "Focus Timer", href: "/focus", icon: Timer },
      { label: "Habits", href: "/habits", icon: Flame },
      { label: "Family Board", href: "/shared", icon: Users },
      { label: "Reminders", href: "/reminders", icon: Bell },
      { label: "Weekly Review", href: "/review", icon: Award },
      { label: "Analytics", href: "/analytics", icon: BarChart3 },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
    href: "/chiefofstaff/dashboard",
  },
  {
    id: "chief-of-finance",
    name: "Chief of Finance",
    tagline: "Personal Finance & Budgeting",
    description: "Track expenses, manage budgets, visualize spending patterns, and get AI-driven financial insights.",
    icon: Wallet,
    gradient: "from-emerald-500 to-green-600",
    shadow: "shadow-emerald-500/20",
    status: "coming" as const,
    features: [],
    href: "#",
  },
  {
    id: "news-guru",
    name: "News Guru",
    tagline: "Curated Insights & Updates",
    description: "Stay ahead with AI-curated news, market updates, and personalized daily briefings from your favorite sources.",
    icon: Newspaper,
    gradient: "from-blue-500 to-cyan-600",
    shadow: "shadow-blue-500/20",
    status: "coming" as const,
    features: [],
    href: "#",
  },
  {
    id: "chief-planner",
    name: "Chief Planner",
    tagline: "Long-term Goals & Strategy",
    description: "Map out your life goals, project roadmaps, and strategic milestones with intelligent planning tools.",
    icon: Map,
    gradient: "from-amber-500 to-orange-600",
    shadow: "shadow-amber-500/20",
    status: "coming" as const,
    features: [],
    href: "#",
  },
];

export default function ModulesHubPage() {
  const [greeting, setGreeting] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const d = new Date();
    const h = d.getHours();
    setGreeting(h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening");
    setDateStr(d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
  }, []);

  return (
    <div className="relative min-h-full pb-12 page-enter">
      {/* Ambient */}
      <div className="fixed top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-violet-600/8 blur-[180px] pointer-events-none -z-0" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-blue-600/6 blur-[160px] pointer-events-none -z-0" />

      <div className="relative z-10 max-w-6xl mx-auto">

        {/* Hero Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Cpu className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                {greeting || "Welcome"} 👋
              </h1>
              <p className="text-white/30 text-sm">{dateStr || "Loading..."}</p>
            </div>
          </div>
          <p className="text-white/40 text-sm ml-14">
            Choose a module to get started, or jump into <Link href="/chiefofstaff/dashboard" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">Chief of Staff</Link>.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {MODULES.map((mod, idx) => {
            const Icon = mod.icon;
            const isLive = mod.status === "live";

            return (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.06 }}
                className={`group relative rounded-3xl border p-6 transition-all duration-300 ${
                  isLive
                    ? "border-violet-500/30 bg-violet-500/[0.04] hover:border-violet-500/50 hover:bg-violet-500/[0.08] hover:shadow-2xl hover:shadow-violet-500/10"
                    : "border-white/[0.06] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                }`}
              >
                {/* Glow overlay for live */}
                {isLive && (
                  <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-violet-500/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                )}

                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center shadow-lg ${isLive ? mod.shadow : "opacity-50"}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    {isLive ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/30 text-[10px] font-bold uppercase tracking-wider">
                        <Lock className="h-2.5 w-2.5" />
                        Coming Soon
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className={`text-lg font-black mb-0.5 ${isLive ? "text-white" : "text-white/50"}`}>{mod.name}</h3>
                  <p className={`text-[11px] font-bold uppercase tracking-wider mb-3 ${isLive ? "text-violet-400/70" : "text-white/20"}`}>
                    {mod.tagline}
                  </p>
                  <p className={`text-sm leading-relaxed mb-5 ${isLive ? "text-white/40" : "text-white/20"}`}>
                    {mod.description}
                  </p>

                  {/* Feature grid for live module */}
                  {isLive && mod.features.length > 0 && (
                    <div className="grid grid-cols-3 gap-1.5 mb-5">
                      {mod.features.map((f) => {
                        const FIcon = f.icon;
                        return (
                          <Link
                            key={f.label}
                            href={f.href}
                            className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-violet-500/10 hover:border-violet-500/20 transition-all group/item"
                          >
                            <FIcon className="h-4 w-4 text-white/30 group-hover/item:text-violet-400 transition-colors" />
                            <span className="text-[9px] font-bold text-white/30 group-hover/item:text-violet-300 transition-colors text-center leading-tight">{f.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {/* CTA */}
                  {isLive ? (
                    <Link
                      href={mod.href}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold hover:shadow-lg hover:shadow-violet-500/25 hover:scale-[1.01] transition-all"
                    >
                      Open Chief of Staff <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <div className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/20 text-sm font-semibold cursor-default">
                      <Lock className="h-3.5 w-3.5" /> Coming Soon
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
