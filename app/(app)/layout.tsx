import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { AutoReloader } from "@/components/auto-reloader";
import { ClientProviders } from "@/components/client-providers";
import { NLQuickAdd } from "@/components/nl-quick-add";
import { headers } from "next/headers";
import { db, settingsTable } from "@/lib/db";
import { eq } from "drizzle-orm";
import { CommandPalette } from "@/components/command-palette";
import { NotificationCenter } from "@/components/notification-center";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Onboarding redirect
  const headersList = await headers();
  const pathname = headersList.get("x-invoke-path") || "";
  if (!pathname.includes("/onboarding")) {
    const [settings] = await db.select().from(settingsTable).where(eq(settingsTable.userId, user.id));
    if (!settings) redirect("/onboarding");
  }

  const isOnboarding = pathname.includes("/onboarding");

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0f] text-white selection:bg-primary/30">
      <AutoReloader />
      <ClientProviders />
      <CommandPalette />
      <Sidebar />

      {/* Main content area — sidebar is 260px wide */}
      <main className="flex-1 ml-0 md:ml-[260px] flex flex-col overflow-hidden">
        {/* Sticky top bar */}
        {!isOnboarding && (
          <div className="sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6 py-3 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
            <div className="flex-1 min-w-0">
              <NLQuickAdd />
            </div>
            <div className="shrink-0">
              <NotificationCenter />
            </div>
          </div>
        )}

        {/* Scrollable page content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 min-h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
