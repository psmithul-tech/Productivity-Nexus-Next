"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const MODULES = [
  {
    id: "chief-of-staff",
    name: "Chief of Staff",
    tagline: "Productivity & Task Intelligence",
    description: "AI-powered task management, calendar sync, smart reminders, focus sessions, habit tracking, family board, and weekly reviews.",
    icon: "meeting_room",
    status: "live" as const,
    theme: {
      border: "border-black",
      bg: "bg-white",
      iconBg: "bg-[#06D6A0] text-black border-[2px] border-black",
      title: "text-black",
      button: "bg-black text-white hover:bg-gray-800 border-[2px] border-black shadow-[0_4px_0_0_rgba(0,0,0,0.2)]",
      pulse: "bg-red-500",
      badge: "bg-[#EF476F] text-white border-[2px] border-black shadow-[0_2px_0_0_#000]"
    },
    features: [
      { label: "Dashboard", href: "/chiefofstaff/dashboard", icon: "dashboard" },
      { label: "Tasks", href: "/chiefofstaff/tasks", icon: "task_alt" },
      { label: "Calendar", href: "/chiefofstaff/calendar", icon: "calendar_today" },
      { label: "AI", href: "#", icon: "auto_awesome" },
      { label: "Focus", href: "/chiefofstaff/focus", icon: "timer" },
      { label: "Habits", href: "/chiefofstaff/habits", icon: "favorite" },
      { label: "Family", href: "/chiefofstaff/shared", icon: "groups" },
      { label: "Reminders", href: "/chiefofstaff/reminders", icon: "notifications" },
      { label: "Review", href: "/chiefofstaff/review", icon: "military_tech" },
      { label: "Analytics", href: "/chiefofstaff/analytics", icon: "bar_chart" },
      { label: "Settings", href: "/chiefofstaff/settings", icon: "settings" },
    ],
    href: "/chiefofstaff/dashboard",
  },
  {
    id: "chief-of-finance",
    name: "Chief of Finance",
    tagline: "Personal Finance & Budgeting",
    description: "Track expenses, manage budgets, visualize spending patterns, and get AI-driven financial insights.",
    icon: "savings",
    status: "coming" as const,
    theme: {
      border: "border-black",
      bg: "bg-gray-100",
      iconBg: "bg-gray-300 text-black border-[2px] border-black",
      title: "text-black",
      button: "bg-gray-300 text-gray-600 border-[2px] border-black cursor-not-allowed",
      pulse: "",
      badge: "bg-gray-200 text-black border-[2px] border-black shadow-[0_2px_0_0_#000]"
    },
    features: [],
    href: "#",
  },
  {
    id: "news-guru",
    name: "News Guru",
    tagline: "Curated Insights & Updates",
    description: "Stay ahead with AI-curated news, market updates, and personalized daily briefings from your favorite sources.",
    icon: "newspaper",
    status: "live" as const,
    theme: {
      border: "border-black",
      bg: "bg-white",
      iconBg: "bg-[#3E85E4] text-white border-[2px] border-black",
      title: "text-black",
      button: "bg-black text-white hover:bg-gray-800 border-[2px] border-black shadow-[0_4px_0_0_rgba(0,0,0,0.2)]",
      pulse: "bg-red-500",
      badge: "bg-[#EF476F] text-white border-[2px] border-black shadow-[0_2px_0_0_#000]"
    },
    features: [
      { label: "India", href: "/news-guru?category=India", icon: "public" },
      { label: "Business", href: "/news-guru?category=Business", icon: "trending_up" },
      { label: "Sports", href: "/news-guru?category=Sports", icon: "sports_baseball" },
      { label: "Space", href: "/news-guru?category=Space", icon: "rocket_launch" },
    ],
    href: "/news-guru?category=India",
  },
  {
    id: "chief-planner",
    name: "Chief Planner",
    tagline: "Long-term Goals & Strategy",
    description: "Map out your life goals, project roadmaps, and strategic milestones with intelligent planning tools.",
    icon: "map",
    status: "live" as const,
    theme: {
      border: "border-black",
      bg: "bg-white",
      iconBg: "bg-[#FFD166] text-black border-[2px] border-black",
      title: "text-black",
      button: "bg-black text-white hover:bg-gray-800 border-[2px] border-black shadow-[0_4px_0_0_rgba(0,0,0,0.2)]",
      pulse: "bg-red-500",
      badge: "bg-[#EF476F] text-white border-[2px] border-black shadow-[0_2px_0_0_#000]"
    },
    features: [
      { label: "Overview", href: "/chief-planner", icon: "map" },
      { label: "Goals", href: "/chief-planner/goals", icon: "flag" },
      { label: "Roadmaps", href: "/chief-planner/roadmaps", icon: "timeline" },
    ],
    href: "/chief-planner",
  },
  {
    id: "attendance-tracker",
    name: "Attendance Tracker",
    tagline: "Class & Work Attendance",
    description: "Monitor your attendance, track absences, calculate percentages, and predict future attendance to meet your goals.",
    icon: "school",
    status: "live" as const,
    theme: {
      border: "border-black",
      bg: "bg-white",
      iconBg: "bg-[#06D6A0] text-black border-[2px] border-black",
      title: "text-black",
      button: "bg-black text-white hover:bg-gray-800 border-[2px] border-black shadow-[0_4px_0_0_rgba(0,0,0,0.2)]",
      pulse: "bg-red-500",
      badge: "bg-[#EF476F] text-white border-[2px] border-black shadow-[0_2px_0_0_#000]"
    },
    features: [
      { label: "Dashboard", href: "/attendance", icon: "bar_chart" },
      { label: "Subjects", href: "/attendance/subjects", icon: "subject" },
    ],
    href: "/attendance",
  },
  {
    id: "streaming-god",
    name: "Streaming God",
    tagline: "The Ultimate Media Agent",
    description: "Search, discover, and stream anime using JARVIS. Deeply integrated with Restia NLP and progress tracking.",
    icon: "play_circle",
    status: "live" as const,
    theme: {
      border: "border-black",
      bg: "bg-white",
      iconBg: "bg-[#EF476F] text-white border-[2px] border-black",
      title: "text-black",
      button: "bg-black text-white hover:bg-gray-800 border-[2px] border-black shadow-[0_4px_0_0_rgba(0,0,0,0.2)]",
      pulse: "bg-red-500",
      badge: "bg-[#EF476F] text-white border-[2px] border-black shadow-[0_2px_0_0_#000]"
    },
    features: [
      { label: "Search", href: "/streaming-god", icon: "search" },
      { label: "Trending", href: "/streaming-god", icon: "local_fire_department" },
    ],
    href: "/streaming-god",
  },
  {
    id: "health-doctor",
    name: "Doctor",
    tagline: "Comprehensive Health Hub",
    description: "Your personal AI doctor and nutritional architect. Manage your diet, set macro goals, and monitor your physical health.",
    icon: "medical_services",
    status: "live" as const,
    theme: {
      border: "border-black",
      bg: "bg-white",
      iconBg: "bg-[#3E85E4] text-white border-[2px] border-black",
      title: "text-black",
      button: "bg-black text-white hover:bg-gray-800 border-[2px] border-black shadow-[0_4px_0_0_rgba(0,0,0,0.2)]",
      pulse: "bg-red-500",
      badge: "bg-[#EF476F] text-white border-[2px] border-black shadow-[0_2px_0_0_#000]"
    },
    features: [
      { label: "Diet Chief", href: "/doctor/diet-chief", icon: "restaurant" },
    ],
    href: "/doctor",
  },
  {
    id: "games-nexus",
    name: "Games Nexus",
    tagline: "Life Chronicle & More",
    description: "Immerse yourself in endless lives, dynasties, and cosmic journeys with Life Chronicle.",
    icon: "sports_esports",
    status: "live" as const,
    theme: {
      border: "border-black",
      bg: "bg-white",
      iconBg: "bg-[#9D4EDD] text-white border-[2px] border-black",
      title: "text-black",
      button: "bg-black text-white hover:bg-gray-800 border-[2px] border-black shadow-[0_4px_0_0_rgba(0,0,0,0.2)]",
      pulse: "bg-red-500",
      badge: "bg-[#EF476F] text-white border-[2px] border-black shadow-[0_2px_0_0_#000]"
    },
    features: [
      { label: "Life Chronicle", href: "/games/life-chronicle", icon: "emoji_events" },
    ],
    href: "/games/life-chronicle",
  },
];

export default function ModulesHubPage() {
  const [greeting, setGreeting] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const d = new Date();
    const h = d.getHours();
    setGreeting(h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening");
    setDateStr(d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "2-digit", day: "2-digit" }));
  }, []);

  return (
    <div className="flex-1 px-4 sm:px-8 py-8 md:py-12 pb-24 max-w-7xl mx-auto w-full">
      {/* Hero Welcome Section */}
      <section className="mb-12">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#FFD166] border-[3px] border-black shadow-[8px_8px_0_0_#000] p-8 md:p-12 mb-12">
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-white px-3 py-1 rounded-md border-[2px] border-black text-[12px] font-black text-black uppercase tracking-widest shadow-[0_2px_0_0_#000]">
                Welcome Back
              </span>
            </div>
            <h2 className="font-heading font-black text-black mb-2 text-4xl sm:text-5xl uppercase tracking-wider drop-shadow-[0_2px_0_rgba(0,0,0,0.1)]">Good {greeting}, User!</h2>
            <p className="font-bold text-black mb-6 text-lg sm:text-xl">
              Stay deeply connected with your friends and family. Explore your modules below to see what's happening in your world today.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border-[2px] border-black shadow-[0_2px_0_0_#000] text-black">
                <span className="material-symbols-outlined text-sm">schedule</span>
                <span className="font-bold text-sm">{dateStr || "Loading..."}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border-[2px] border-black shadow-[0_2px_0_0_#000] text-black">
                <span className="material-symbols-outlined text-sm">rocket_launch</span>
                <span className="font-bold text-sm">{MODULES.filter(m => m.status === 'live').length} Modules Active</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {MODULES.map((mod, idx) => {
          const isLive = mod.status === "live";

          return (
            <motion.article
              key={mod.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.06 }}
              className={`rounded-[2rem] border-[3px] shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] transition-all ${mod.theme.bg} ${mod.theme.border} p-8 flex flex-col ${!isLive ? "opacity-90 relative" : ""}`}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-[0_2px_0_0_#000] ${mod.theme.iconBg}`}>
                  <span className="material-symbols-outlined text-3xl">{mod.icon}</span>
                </div>
                {isLive ? (
                  <span className={`px-3 py-1 text-[10px] uppercase tracking-widest font-black rounded-md flex items-center gap-1.5 ${mod.theme.badge}`}>
                    <span className={`w-2 h-2 rounded-full animate-pulse ${mod.theme.pulse} border-[1px] border-black`}></span>
                    LIVE
                  </span>
                ) : (
                  <span className={`px-3 py-1 text-[10px] uppercase tracking-widest font-black rounded-md flex items-center gap-1.5 ${mod.theme.badge}`}>
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    OFFLINE
                  </span>
                )}
              </div>

              {/* Title & Tagline */}
              <h3 className={`font-heading text-2xl mb-1 font-black uppercase tracking-wider ${mod.theme.title}`}>{mod.name}</h3>
              <p className="font-bold text-[10px] text-gray-500 uppercase tracking-widest mb-4">
                // {mod.tagline}
              </p>
              <p className="font-bold text-sm text-gray-600 mb-8 leading-relaxed line-clamp-3">
                {mod.description}
              </p>

              {/* Feature Grid or Locked State */}
              {isLive ? (
                <div className="grid grid-cols-3 gap-2 mb-8 mt-auto">
                  {mod.features.map((f) => (
                    <Link
                      key={f.label}
                      href={f.href}
                      className="bg-gray-100 border-[2px] border-black p-3 rounded-xl flex flex-col items-center gap-1 hover:bg-[#3E85E4] hover:text-white transition-colors cursor-pointer group shadow-[0_2px_0_0_#000] hover:shadow-[0_2px_0_0_#000]"
                    >
                      <span className={`material-symbols-outlined group-hover:text-white group-hover:scale-110 transition-all ${mod.theme.title}`}>
                        {f.icon}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider truncate w-full text-center group-hover:text-white">
                        {f.label}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center items-center py-8 text-center px-4 mb-4 mt-auto">
                  <div className="w-16 h-16 bg-gray-200 border-[2px] border-black rounded-xl shadow-[0_2px_0_0_#000] flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-gray-400 text-3xl">vpn_key</span>
                  </div>
                  <p className="font-bold text-xs uppercase tracking-widest text-gray-500">Waiting for access</p>
                </div>
              )}

              {/* CTA Button */}
              {isLive ? (
                <Link
                  href={mod.href}
                  className={`mt-auto w-full py-4 font-black uppercase tracking-widest text-sm rounded-xl flex items-center justify-center gap-2 transition-all hover:translate-y-[2px] hover:shadow-none ${mod.theme.button}`}
                >
                  <span>Open {mod.name.split(" ").pop()}</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              ) : (
                <button
                  disabled
                  className={`mt-auto w-full py-4 font-black uppercase tracking-widest text-sm rounded-xl flex items-center justify-center gap-2 transition-all ${mod.theme.button}`}
                >
                  <span className="material-symbols-outlined text-sm">lock</span>
                  <span>Module Locked</span>
                </button>
              )}
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}
