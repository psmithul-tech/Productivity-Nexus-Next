"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState, Suspense } from "react";
import { useSidebar } from "./sidebar-context";

import {
  LayoutDashboard, CheckSquare, Calendar, Bell, Sparkles,
  BarChart3, Settings, LogOut, Briefcase, Timer, Users, Flame, Award, Map, GraduationCap, Cpu, Play, Trophy,
  HeartPulse, Target, CheckCircle2, BrainCircuit, Apple, Search, Activity
} from "lucide-react";

import { ThemeToggle } from "./theme-toggle";

const CHIEF_OF_STAFF_GROUPS = [
  {
    title: "Chief of Staff",
    items: [
      { href: "/chiefofstaff/dashboard", icon: LayoutDashboard, label: "Overview" },
    ]
  },
  {
    title: "Workspace",
    items: [
      { href: "/chiefofstaff/focus", icon: BrainCircuit, label: "Focus Lab" },
      { href: "/chiefofstaff/shared", icon: Users, label: "Family Board" },
      { href: "/chiefofstaff/habits", icon: Target, label: "Habit Protocol" },
      { href: "/chiefofstaff/tasks", icon: CheckCircle2, label: "Task Matrix" },
      { href: "/chiefofstaff/calendar", icon: Calendar, label: "Time Sandbox" },
      { href: "/chiefofstaff/deep-research", icon: Search, label: "Deep Research" },
      { href: "/chiefofstaff/review", icon: Award, label: "Weekly Review" },
      { href: "/chiefofstaff/reminders", icon: Bell, label: "Reminders" },
    ]
  },
  {
    title: "System",
    items: [
      { href: "/chiefofstaff/processes", icon: Activity, label: "System Status" },
      { href: "/chiefofstaff/analytics", icon: BarChart3, label: "Analytics" },
      { href: "/chiefofstaff/settings", icon: Settings, label: "Settings" },
    ]
  }
];

const STREAMING_GOD_GROUPS = [
  {
    title: "Streaming God",
    items: [
      { href: "/streaming-god", icon: Play, label: "Player" },
    ]
  }
];

const RESTIA_CORE_GROUPS = [
  {
    title: "Restia Core",
    items: [
      { href: "/restia-core", icon: Sparkles, label: "Core Interface" },
    ]
  }
];

const DOCTOR_GROUPS = [
  {
    title: "Doctor",
    items: [
      { href: "/doctor/diet-chief", icon: Apple, label: "Diet Chief" },
    ]
  }
];

const NEWS_GURU_GROUPS = [
  {
    title: "News Guru",
    items: [
      { href: "/news-guru?category=ALL", icon: LayoutDashboard, label: "All News" },
      { href: "/news-guru?category=India", icon: Briefcase, label: "India" },
      { href: "/news-guru?category=Business", icon: BarChart3, label: "Business" },
      { href: "/news-guru?category=Sports", icon: Flame, label: "Sports" },
      { href: "/news-guru?category=Space", icon: Sparkles, label: "Space" },
      { href: "/news-guru?category=Technology", icon: Cpu, label: "Technology" },
    ]
  }
];

const CHIEF_PLANNER_GROUPS = [
  {
    title: "Chief Planner",
    items: [
      { href: "/chief-planner", icon: Map, label: "Overview" }
    ]
  }
];

const ATTENDANCE_TRACKER_GROUPS = [
  {
    title: "Attendance Tracker",
    items: [
      { href: "/attendance", icon: BarChart3, label: "Dashboard" },
      { href: "/attendance/subjects", icon: GraduationCap, label: "Subjects" },
    ]
  }
];

const GAMES_GROUPS = [
  {
    title: "Games",
    items: [
      { href: "/games/life-chronicle", icon: Trophy, label: "Life Chronicle" },
    ]
  }
];

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const { mobileOpen, setMobileOpen } = useSidebar();

  let activeGroups = CHIEF_OF_STAFF_GROUPS;
  let activeModule = "Chief of Staff";
  
  if (pathname.startsWith("/streaming-god")) {
    activeGroups = STREAMING_GOD_GROUPS;
    activeModule = "Streaming God";
  } else if (pathname.startsWith("/restia-core")) {
    activeGroups = RESTIA_CORE_GROUPS;
    activeModule = "Restia Core";
  } else if (pathname.startsWith("/doctor")) {
    activeGroups = DOCTOR_GROUPS;
    activeModule = "Doctor";
  } else if (pathname.startsWith("/news-guru")) {
    activeGroups = NEWS_GURU_GROUPS;
    activeModule = "News Guru";
  } else if (pathname.startsWith("/chief-planner")) {
    activeGroups = CHIEF_PLANNER_GROUPS;
    activeModule = "Chief Planner";
  } else if (pathname.startsWith("/attendance")) {
    activeGroups = ATTENDANCE_TRACKER_GROUPS;
    activeModule = "Attendance Tracker";
  } else if (pathname.startsWith("/games")) {
    activeGroups = GAMES_GROUPS;
    activeModule = "Games Nexus";
  }

  const currentNavGroups = [
    {
      title: "Navigation",
      items: [
        { href: "/dashboard", icon: Cpu, label: "Modules Hub" }
      ]
    },
    ...activeGroups
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside 
        id="sidebar"
        className={`fixed left-0 top-0 h-full flex flex-col p-2 z-50 bg-white dark:bg-surface-container-lowest w-80 border-r-[3px] border-black dark:border-surface-variant shadow-[4px_0_0_0_rgba(0,0,0,0.05)] transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="px-6 py-8 flex flex-col gap-1 border-b-2 border-black dark:border-surface-variant mb-4">
          <h1 className="font-heading text-4xl font-black text-black dark:text-primary tracking-widest uppercase drop-shadow-[0_2px_0_rgba(0,0,0,0.2)]">Restia OS</h1>
          <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">{activeModule}</p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
          {currentNavGroups.map((group, idx) => (
            <div key={group.title} className={idx > 0 ? "mt-4" : ""}>
              <div className="px-4 mb-3">
                <span className="font-bold text-[10px] text-gray-400 dark:text-on-surface-variant uppercase tracking-widest bg-gray-100 dark:bg-surface-variant/50 px-2 py-1 rounded-md border-[2px] border-gray-200 dark:border-transparent">{group.title}</span>
              </div>
              {group.items.map(({ href, icon: Icon, label }) => {
                const isHome = href === "/dashboard" && pathname === "/dashboard";
                let active = false;
                if (href.includes("?")) {
                  const [basePath, query] = href.split("?");
                  const queryParam = new URLSearchParams(query);
                  let matchesAll = true;
                  for (const [k, v] of queryParam.entries()) {
                    if (searchParams.get(k) !== v) matchesAll = false;
                  }
                  active = pathname === basePath && matchesAll;
                } else {
                  active = pathname.startsWith(href) && href !== "/dashboard";
                }
                const isActive = active || isHome;
                
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-200 mb-2 font-bold text-sm border-[2px] ${
                      isActive 
                      ? 'bg-[#FFD166] dark:bg-primary text-black border-black dark:border-primary shadow-[0_3px_0_0_#000] dark:shadow-none translate-x-1' 
                      : 'text-gray-500 dark:text-on-surface-variant border-transparent hover:border-black dark:hover:border-surface-variant hover:bg-gray-50 dark:hover:bg-surface-variant/30 hover:text-black dark:hover:text-on-surface hover:shadow-[0_2px_0_0_#000] dark:hover:shadow-none'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="px-4 py-6 border-t-[3px] border-black dark:border-surface-variant flex flex-col gap-3 mt-auto bg-gray-50 dark:bg-surface-container-lowest -mx-2 mb-[-8px]">
          <Link 
            href="/chiefofstaff/focus"
            onClick={() => setMobileOpen(false)}
            className="w-full bg-[#06D6A0] text-black border-[2px] border-black dark:border-transparent shadow-[0_3px_0_0_#000] dark:shadow-none rounded-xl py-3 font-heading font-black uppercase tracking-wider hover:translate-y-[2px] transition-all flex items-center justify-center gap-2"
          >
            <Timer className="w-5 h-5" />
            Enter Flow
          </Link>
          <div className="mt-2 flex items-center justify-between gap-2">
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-2 text-white bg-[#EF476F] border-[2px] border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-none px-4 py-2 hover:translate-y-[2px] rounded-lg transition-all font-bold uppercase text-[10px] flex-1 justify-center"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sign Out</span>
            </button>
            <div className="bg-white dark:bg-surface-container-high border-[2px] border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-none rounded-lg overflow-hidden shrink-0">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export function Sidebar() {
  return (
    <Suspense fallback={<aside className="fixed left-0 top-0 h-full w-80 bg-white border-r-[3px] border-black shadow-[4px_0_0_0_rgba(0,0,0,0.05)]"></aside>}>
      <SidebarContent />
    </Suspense>
  );
}
