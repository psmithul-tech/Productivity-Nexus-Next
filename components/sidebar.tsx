"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, CheckSquare, Calendar, Bell, Sparkles,
  BarChart3, Settings, LogOut, Briefcase, Menu, X, Timer, Users, Flame, Award, AtSign, Cpu
} from "lucide-react";

const navigationGroups = [
  {
    title: "Restia",
    items: [
      { href: "/dashboard", icon: Cpu, label: "Modules Hub" },
    ]
  },
  {
    title: "Chief of Staff",
    items: [
      { href: "/chiefofstaff/dashboard", icon: LayoutDashboard, label: "Overview" },
    ]
  },
  {
    title: "Workspace",
    items: [
      { href: "/chiefofstaff/tasks", icon: CheckSquare, label: "Tasks" },
      { href: "/chiefofstaff/calendar", icon: Calendar, label: "Calendar" },
      { href: "/chiefofstaff/shared", icon: Users, label: "Family Board" },
    ]
  },
  {
    title: "Routines",
    items: [
      { href: "/chiefofstaff/habits", icon: Flame, label: "Habits" },
      { href: "/chiefofstaff/focus", icon: Timer, label: "Focus Timer" },
      { href: "/chiefofstaff/review", icon: Award, label: "Weekly Review" },
      { href: "/chiefofstaff/reminders", icon: Bell, label: "Reminders" },
    ]
  },
  {
    title: "System",
    items: [
      { href: "/chiefofstaff/analytics", icon: BarChart3, label: "Analytics" },
      { href: "/chiefofstaff/settings", icon: Settings, label: "Settings" },
    ]
  }
];

import { useSidebar } from "./sidebar-context";

export function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState<string | null>(null);
  const { mobileOpen, setMobileOpen } = useSidebar();
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      // Fetch username from settings
      if (data.user) {
        fetch("/api/settings")
          .then(r => r.ok ? r.json() : null)
          .then(s => { if (s?.username) setUsername(s.username); })
          .catch(() => {});
      }
    });
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <>

      {/* Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full z-40 w-[260px] flex flex-col border-r border-white/[0.06] bg-[#080810]/98 backdrop-blur-3xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 shadow-[0_0_20px_rgba(139,92,246,0.35)]">
            <Briefcase className="h-4.5 w-4.5 text-white" />
            <div className="absolute inset-0 rounded-xl ring-1 ring-white/20" />
          </div>
          <div>
            <p className="font-bold text-sm tracking-tight text-white leading-none">Restia <span className="text-[9px] text-white/30 font-semibold uppercase tracking-widest ml-1">OS</span></p>
            <p className="text-[10px] font-medium text-violet-400/60 uppercase tracking-widest mt-0.5">Chief of Staff</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto scrollbar-none">
          {navigationGroups.map((group) => (
            <div key={group.title}>
              <h4 className="px-2.5 mb-1.5 text-[9px] font-semibold tracking-[0.18em] text-white/25 uppercase">
                {group.title}
              </h4>
              <ul className="space-y-0.5">
                {group.items.map(({ href, icon: Icon, label, badge }) => {
                  const active = pathname.startsWith(href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={() => setMobileOpen(false)}
                        className={`group relative flex items-center gap-3 px-2.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-150
                          ${active
                            ? "text-indigo-300"
                            : "text-white/45 hover:text-white/80 hover:bg-white/[0.04]"
                          }`}
                      >
                        {active && (
                          <motion.div
                            layoutId="active-pill"
                            className="absolute inset-0 rounded-xl bg-indigo-500/12 border border-indigo-500/15"
                            initial={false}
                            transition={{ type: "spring", stiffness: 400, damping: 35 }}
                          />
                        )}
                        <Icon className={`relative z-10 h-4 w-4 shrink-0 ${active ? "text-indigo-400" : ""}`} />
                        <span className="relative z-10 flex-1">{label}</span>
                        {badge && (
                          <span className={`relative z-10 px-1.5 py-px rounded text-[9px] font-bold tracking-wider ${active ? "bg-indigo-500/20 text-indigo-300" : "bg-white/[0.06] text-white/35"}`}>
                            {badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-white/[0.06]">
          <div className="group flex items-center gap-3 px-2.5 py-2.5 rounded-xl hover:bg-white/[0.04] transition-all duration-200 cursor-default border border-transparent hover:border-white/[0.06]">
            {user?.user_metadata?.avatar_url
              ? <img src={user.user_metadata.avatar_url} className="h-8 w-8 rounded-full object-cover ring-2 ring-white/10 shrink-0" alt="" />
              : <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white ring-2 ring-white/10 shrink-0">{user?.email?.[0]?.toUpperCase() ?? "U"}</div>
            }
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"}
              </p>
              {username ? (
                <p className="text-[10px] text-indigo-400/70 truncate flex items-center gap-0.5 mt-px">
                  <AtSign className="h-2.5 w-2.5" />{username}
                </p>
              ) : (
                <p className="text-[10px] text-white/30 truncate mt-px">{user?.email ?? ""}</p>
              )}
            </div>
            <button
              onClick={handleSignOut}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/15 text-white/30 hover:text-red-400 transition-all duration-200 shrink-0"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
