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

import { SidebarProvider } from "@/components/sidebar-context";
import { Topbar } from "@/components/topbar";
import { RestiaProvider } from "@/components/restia-context";
import { RestiaCompanion } from "@/components/restia-companion";

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
    <SidebarProvider>
      <RestiaProvider>
        <div className="flex h-[100dvh] overflow-hidden bg-[#E5E5E5] dark:bg-background text-black dark:text-on-surface antialiased font-body">
          <AutoReloader />
          <ClientProviders />
          <CommandPalette />
          <Sidebar />

          {/* Main Content Wrapper */}
          <div className="flex-1 flex flex-col md:ml-80 w-full md:w-[calc(100%-320px)] h-[100dvh] overflow-hidden relative">
            {/* TopAppBar */}
            {!isOnboarding && (
              <div className="absolute top-0 left-0 w-full z-40">
                <Topbar userAvatar={user.user_metadata?.avatar_url} />
              </div>
            )}

            {/* Scrollable Canvas */}
            <main className={`flex-1 overflow-y-auto px-4 pb-4 sm:px-8 sm:pb-8 lg:px-12 lg:pb-12 space-y-8 relative custom-scrollbar ${!isOnboarding ? 'pt-28 sm:pt-32' : 'pt-4 sm:pt-8'}`}>
              {children}
            </main>
          </div>
        </div>
      </RestiaProvider>
    </SidebarProvider>
  );
}
