import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { db, researchTable } from "@/lib/db";
import { eq, or, desc, and } from "drizzle-orm";
import { Activity, Clock, Server, Loader2, AlertTriangle, Search, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProcessesPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch running/pending/error processes from deep research as our main background tasks
  const processes = await db.select()
    .from(researchTable)
    .where(
      and(
        eq(researchTable.userId, session.user.id),
        or(
          eq(researchTable.status, "pending"),
          eq(researchTable.status, "processing"),
          eq(researchTable.status, "error")
        )
      )
    )
    .orderBy(desc(researchTable.createdAt));

  const activeCount = processes.filter(p => p.status === "processing" || p.status === "pending").length;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 border-b-4 border-black pb-4">
        <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center shadow-[4px_4px_0_0_#FFD166] shrink-0">
          <Activity className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-black font-heading uppercase tracking-tight text-black dark:text-white drop-shadow-[2px_2px_0_rgba(0,0,0,0.1)] dark:drop-shadow-none">
            System Status
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-sm flex items-center gap-2">
            <Server className="w-4 h-4" /> 
            Active Background Processes: {activeCount}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-container border-[3px] border-black shadow-[8px_8px_0_0_#000] rounded-2xl overflow-hidden p-6 space-y-6">
        <h2 className="font-heading font-black text-2xl uppercase tracking-wider flex items-center gap-2 border-b-2 border-dashed border-gray-200 dark:border-surface-variant pb-2">
          <Clock className="w-6 h-6 text-[#118AB2]" />
          Process Queue
        </h2>

        {processes.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-surface-variant rounded-xl bg-gray-50 dark:bg-surface-container-low">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-bold text-gray-500 uppercase tracking-widest text-sm">No Active Processes</p>
            <p className="text-gray-400 text-xs mt-1">All background queues are currently empty.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {processes.map((proc) => {
              const isStuck = (proc.status === "pending" || proc.status === "processing") && 
                              (new Date().getTime() - new Date(proc.createdAt).getTime() > 10 * 60 * 1000);
              const isError = proc.status === "error" || isStuck;
              const isWorking = proc.status === "pending" || proc.status === "processing";

              return (
                <div key={proc.id} className="flex items-center gap-4 p-4 rounded-xl border-[2px] border-black bg-gray-50 dark:bg-surface-container-low shadow-[4px_4px_0_0_rgba(0,0,0,0.1)]">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center border-2 border-black shrink-0 shadow-[2px_2px_0_0_#000]
                    ${isWorking ? 'bg-[#FFD166] text-black' : isError ? 'bg-[#EF476F] text-white' : 'bg-[#06D6A0] text-black'}`}>
                    {isWorking ? <Loader2 className="w-6 h-6 animate-spin" /> : 
                     isError ? <AlertTriangle className="w-6 h-6" /> : 
                     <Search className="w-6 h-6" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-black
                        ${isWorking ? 'bg-[#FFD166] text-black' : isError ? 'bg-[#EF476F] text-white' : 'bg-[#06D6A0] text-black'}`}>
                        {isWorking ? 'Processing' : isError ? 'Failed' : proc.status}
                      </span>
                      <span className="text-xs font-bold text-gray-500 tracking-wider">
                        {new Date(proc.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="font-bold text-sm truncate text-black dark:text-white">
                      Deep Research: <span className="font-normal text-gray-600 dark:text-gray-300">"{proc.query}"</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
