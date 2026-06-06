import Link from "next/link";


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
    icon: "work",
    status: "live" as const,
    features: ["Tasks & Priorities", "Calendar Sync", "AI Assistant", "Focus Timer", "Habits", "Family Board", "Analytics"],
    href: "/login",
  },
  {
    id: "vault",
    name: "Vault",
    tagline: "Personal Finance & Budgeting",
    description: "Track expenses, manage budgets, visualize spending patterns, and get AI-driven financial insights.",
    icon: "account_balance_wallet",
    status: "coming" as const,
    features: ["Expense Tracking", "Budget Goals", "Investment View", "AI Insights"],
    href: "#",
  },
  {
    id: "pulse",
    name: "Pulse",
    tagline: "Health & Wellness Tracker",
    description: "Monitor sleep, nutrition, workouts, and mental wellness with intelligent health correlations.",
    icon: "monitor_heart",
    status: "coming" as const,
    features: ["Sleep Tracking", "Workout Log", "Nutrition", "Mood Journal"],
    href: "#",
  },
  {
    id: "atlas",
    name: "Atlas",
    tagline: "Learning & Knowledge Base",
    description: "Capture notes, build a personal wiki, track courses, and let AI connect your knowledge dots.",
    icon: "school",
    status: "coming" as const,
    features: ["Smart Notes", "Course Tracker", "Knowledge Graph", "Flashcards"],
    href: "#",
  },
  {
    id: "nest",
    name: "Nest",
    tagline: "Home & Life Management",
    description: "Grocery lists, meal planning, home maintenance schedules, and household coordination.",
    icon: "home",
    status: "coming" as const,
    features: ["Grocery Lists", "Meal Planner", "Home Tasks", "Shared Lists"],
    href: "#",
  },
  {
    id: "sentinel",
    name: "Sentinel",
    tagline: "Digital Security & Passwords",
    description: "Password vault, breach monitoring, 2FA management, and security health scoring.",
    icon: "shield",
    status: "coming" as const,
    features: ["Password Vault", "Breach Alerts", "2FA Manager", "Security Score"],
    href: "#",
  },
  {
    id: "streaming-god",
    name: "Streaming God",
    tagline: "The Ultimate Media Agent",
    description: "Search, discover, and stream anime using JARVIS. Deeply integrated with Restia NLP and progress tracking.",
    icon: "play_circle",
    status: "live" as const,
    features: ["Anime Search", "HLS Player", "Progress Tracking", "JARVIS Voice Control"],
    href: "/streaming-god",
  },
];

function StatusBadge({ status }: { status: "live" | "coming" }) {
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-mono-label text-[11px] uppercase tracking-wider shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        Live
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0F4F8] text-on-surface-variant font-mono-label text-[11px] uppercase tracking-wider">
      <span className="material-symbols-outlined text-[14px]">lock</span>
      Coming Soon
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-on-surface overflow-x-hidden selection:bg-primary/30">
      {/* Background */}
      <div className="fixed inset-0 bg-[#FAFAFA] -z-10" />

      {/* ── Header ── */}
      <header className="relative z-20 py-4 px-4 sm:px-8 max-w-7xl mx-auto w-full flex justify-between items-center mt-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#FAF5F0] border border-[#E8DCC8] flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-primary text-[20px]">memory</span>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-on-surface">Restia</span>
            <span className="hidden sm:inline font-mono-label text-[10px] text-primary uppercase tracking-widest ml-2">OS</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="font-mono-label text-[13px] text-on-surface-variant hover:text-primary transition-colors uppercase tracking-wider"
          >
            Log In
          </Link>
          <Link
            href="/login"
            className="px-6 py-2.5 rounded-full bg-primary text-white font-mono-label text-[13px] font-bold hover:bg-primary/90 hover:shadow-sm transition-all uppercase tracking-wider"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative z-10 text-center px-4 sm:px-8 pt-20 sm:pt-32 pb-20 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F0F4F8] font-mono-label text-[12px] text-primary uppercase tracking-widest mb-8 border border-outline-variant/10">
          <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
          System Active
        </div>

        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[0.95] mb-8 font-data-metric uppercase">
          <span className="block text-outline">Connect with</span>
          <span className="block text-primary text-shadow-sm">Your People.</span>
        </h1>

        <p className="text-lg sm:text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed mb-12 font-body-lg">
          Restia is an intelligent operating system meant for families and friends.
          Stay coordinated, manage tasks together, and stay deeply connected in the real world.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-24">
          <Link
            href="/login"
            className="group flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-white font-mono-label text-[14px] font-bold hover:bg-primary/90 hover:shadow-sm transition-all uppercase tracking-widest"
          >
            Access Terminal
            <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </Link>
          <a
            href="#modules"
            className="flex items-center gap-2 px-8 py-4 rounded-full bg-[#F0F4F8] hover:bg-[#E2E8F0] text-on-surface-variant font-mono-label text-[14px] font-bold transition-all uppercase tracking-widest"
          >
            List Modules
            <span className="material-symbols-outlined text-[18px]">expand_more</span>
          </a>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { value: "06", label: "Modules", sub: "AVAILABLE" },
            { value: "∞", label: "Automations", sub: "NEURAL-NET" },
            { value: "24/7", label: "Uptime", sub: "BACKGROUND" },
          ].map((stat, idx) => (
            <div key={stat.label} className="bg-surface border border-outline-variant/20 rounded-[2rem] p-8 flex flex-col items-center justify-center shadow-sm">
              <p className="text-4xl sm:text-5xl font-headline-lg font-black text-primary mb-2">{stat.value}</p>
              <p className="font-mono-label text-[12px] font-bold text-on-surface uppercase tracking-wider">{stat.label}</p>
              <p className="text-[10px] text-on-surface-variant font-mono-label mt-1">[{stat.sub}]</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Modules Grid ── */}
      <section id="modules" className="relative z-10 px-4 sm:px-8 pb-32 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-headline-sm tracking-tight mb-4 text-on-surface uppercase">
            Modular <span className="text-primary ">Architecture</span>
          </h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto">
            Each module is a self-contained AI agent that manages one domain of your life. Activate what you need, when you need it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            const isLive = mod.status === "live";
            return (
              <div
                key={mod.id}
                className={`group relative rounded-[2rem] p-8 transition-all duration-300 shadow-sm border ${
                  isLive
                    ? "bg-surface border-outline-variant/20 hover:border-primary/50 hover:shadow-md"
                    : "bg-[#F0F4F8] border-transparent"
                }`}
              >
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${isLive ? 'bg-primary/10 text-primary' : 'bg-surface text-on-surface-variant shadow-sm'}`}>
                      <span className="material-symbols-outlined text-[24px]">{Icon}</span>
                    </div>
                    <StatusBadge status={mod.status} />
                  </div>

                  <h3 className={`font-headline-sm text-xl font-bold mb-2 ${isLive ? 'text-on-surface' : 'text-on-surface-variant'}`}>{mod.name}</h3>
                  <p className={`font-mono-label text-[10px] uppercase tracking-wider mb-4 ${isLive ? "text-primary" : "text-on-surface-variant"}`}>
                    // {mod.tagline}
                  </p>
                  <p className="text-[14px] text-on-surface-variant leading-relaxed mb-6 font-body-sm h-16">
                    {mod.description}
                  </p>

                  {/* Feature pills */}
                  <div className="flex flex-wrap gap-2 mb-8">
                    {mod.features.slice(0, 4).map((f) => (
                      <span
                        key={f}
                        className={`px-3 py-1.5 rounded-full font-mono-label text-[9px] uppercase tracking-wider ${
                          isLive
                            ? "bg-primary/5 text-primary"
                            : "bg-surface text-on-surface-variant shadow-sm"
                        }`}
                      >
                        {f}
                      </span>
                    ))}
                  </div>

                  {isLive ? (
                    <Link
                      href={mod.href}
                      className="flex items-center gap-2 font-mono-label text-sm text-white bg-primary px-4 py-3 rounded-xl justify-center hover:bg-primary/90 hover:shadow-sm transition-all uppercase tracking-wider"
                    >
                      Initialize <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                  ) : (
                    <div className="flex items-center justify-center py-3 rounded-xl bg-surface/50 font-mono-label text-xs text-on-surface-variant uppercase tracking-wider cursor-not-allowed">
                      Offline
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Architecture Section ── */}
      <section className="relative z-10 px-4 sm:px-8 pb-32 max-w-5xl mx-auto">
        <div className="bg-surface border border-outline-variant/20 rounded-[2rem] p-8 sm:p-12 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[24px]">psychology</span>
            </div>
            <h2 className="text-2xl font-headline-sm uppercase text-on-surface font-bold">System <span className="text-primary ">Internals</span></h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Agent Nodes",
                desc: "Each module runs as an independent AI agent with its own data, logic, and intelligence layer.",
                icon: "memory",
              },
              {
                step: "02",
                title: "Core Bus",
                desc: "All modules share a common identity, notification system, and AI backbone — seamlessly connected.",
                icon: "language",
              },
              {
                step: "03",
                title: "Neural Sync",
                desc: "Restia learns your patterns, preferences, and rhythms to proactively help before you ask.",
                icon: "trending_up",
              },
            ].map((item) => {
              const StepIcon = item.icon;
              return (
                <div key={item.step} className="text-left border-l-2 border-outline-variant/20 pl-6 hover:border-primary/50 transition-colors">
                  <div className="mb-4">
                    <span className="material-symbols-outlined text-[28px] text-primary">{StepIcon}</span>
                  </div>
                  <p className="font-mono-label text-[10px] text-primary uppercase tracking-widest mb-2">SEQ_{item.step}</p>
                  <h3 className="font-headline-sm font-bold text-lg text-on-surface mb-2 uppercase">{item.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed font-body-sm">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 text-center px-4 sm:px-8 pb-32 max-w-3xl mx-auto pt-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 font-mono-label text-[12px] text-primary uppercase tracking-wider mb-8 shadow-sm">
          <span className="material-symbols-outlined text-[14px]">star</span> Beta Access Open
        </div>
        <h2 className="text-4xl sm:text-5xl font-headline-lg font-black tracking-tight mb-6 uppercase">
          <span className="block text-on-surface">Boot Sequence</span>
          <span className="block text-primary mt-2">Initiated.</span>
        </h2>
        <p className="text-on-surface-variant mb-10 max-w-xl mx-auto font-body-lg">
          Start with Chief of Staff today. Your digital brain awaits.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-primary text-white font-mono-label text-lg font-bold hover:bg-primary/90 hover:shadow-sm transition-all uppercase tracking-widest"
        >
          <span className="material-symbols-outlined text-[20px]">bolt</span> Run Restia.exe
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 py-12 px-4 sm:px-8 bg-surface border-t border-outline-variant/20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-[#FAF5F0] border border-[#E8DCC8] flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[14px]">memory</span>
            </div>
            <span className="font-mono-label text-[12px] font-bold text-on-surface uppercase tracking-widest">Restia OS</span>
          </div>
          <div className="flex gap-6 font-mono-label text-[12px] text-on-surface-variant uppercase tracking-wider">
            <Link href="/privacy" className="hover:text-primary transition-colors">[ PRIVACY ]</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">[ TERMS ]</Link>
          </div>
          <p className="font-mono-label text-[10px] text-on-surface-variant uppercase tracking-widest">v1.0.0 © 2026</p>
        </div>
      </footer>
    </div>
  );
}

