import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { db, settingsTable } from "@/lib/db";
import { eq } from "drizzle-orm";

export default async function HubLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Onboarding check
  const [settings] = await db.select().from(settingsTable).where(eq(settingsTable.userId, user.id));
  if (!settings) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-background text-on-surface selection:bg-primary/30">
      <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
        {children}
      </div>
    </div>
  );
}
