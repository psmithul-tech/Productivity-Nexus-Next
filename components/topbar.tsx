"use client";
import { usePathname } from "next/navigation";
import { MobileToggle } from "./mobile-toggle";
import { NotificationCenter } from "./notification-center";
import { NLQuickAdd } from "./nl-quick-add";
import { useSidebar } from "./sidebar-context";

import { ThemeToggle } from "./theme-toggle";

export function Topbar({ userAvatar }: { userAvatar?: string | null }) {
  const pathname = usePathname();
  const { setMobileOpen } = useSidebar();

  // Simple Breadcrumb logic
  const parts = pathname.split("/").filter(Boolean);
  const title = parts.length > 0 ? parts[0].toUpperCase() : "DASHBOARD";
  const subtitle = parts.length > 1 ? parts.slice(1).join("_").toUpperCase() : "MAIN";

  return (
    <header className="flex justify-between items-center w-full px-6 md:px-12 h-20 bg-white dark:bg-surface-container-lowest border-b-[3px] border-black dark:border-surface-variant shadow-[0_4px_0_0_rgba(0,0,0,0.05)] dark:shadow-none z-40 shrink-0">
      {/* Left: Breadcrumb/Title */}
      <div className="flex items-center gap-4">
        <div className="md:hidden">
          <MobileToggle />
        </div>
        <span className="font-heading text-2xl text-black dark:text-primary font-black tracking-widest uppercase hidden sm:inline drop-shadow-[0_2px_0_rgba(0,0,0,0.2)] dark:drop-shadow-none">Restia OS</span>
        <span className="text-black dark:text-on-surface-variant font-black hidden sm:inline">/</span>
        <span className="font-bold text-[10px] text-white dark:text-primary bg-[#3E85E4] dark:bg-primary/20 border-[2px] border-black dark:border-transparent px-2 py-1 rounded-md shadow-[0_2px_0_0_#000] dark:shadow-none max-w-[120px] sm:max-w-none truncate uppercase tracking-widest">
          {title} {subtitle !== "MAIN" ? `- ${subtitle}` : ""}
        </span>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-6">
        {/* Search / NL Quick Add */}
        <div className="relative hidden lg:block w-96 group">
          <div className="relative z-20">
            <NLQuickAdd />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-surface-container-high border-[2px] border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-none rounded-xl overflow-hidden flex items-center h-10 w-10 justify-center">
            <NotificationCenter />
          </div>
        </div>

        {/* Divider */}
        <div className="w-[3px] h-8 bg-black dark:bg-surface-variant hidden sm:block"></div>

        {/* Profile */}
        <button className="flex items-center gap-3 hover:translate-y-[2px] hover:shadow-none dark:hover:bg-surface-variant/30 p-1 sm:pr-4 rounded-xl transition-all border-[2px] border-black dark:border-transparent bg-[#FFD166] dark:bg-surface-container-high shadow-[0_3px_0_0_#000] dark:shadow-none">
          <div className="w-8 h-8 rounded-lg bg-white dark:bg-surface-container-lowest flex items-center justify-center overflow-hidden border-[2px] border-black dark:border-transparent shrink-0">
            {userAvatar ? (
              <img src={userAvatar} className="w-full h-full object-cover" alt="Profile" />
            ) : (
              <span className="material-symbols-outlined text-black dark:text-on-surface text-sm">person</span>
            )}
          </div>
          <div className="hidden lg:flex flex-col items-start">
            <span className="font-bold text-xs text-black dark:text-on-surface uppercase tracking-wider">Admin</span>
          </div>
        </button>
      </div>
    </header>
  );
}
