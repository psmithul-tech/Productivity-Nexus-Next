import { createClient } from "@/utils/supabase/server";
import { db, researchTable } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Search, Loader2, CheckCircle, FileText, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { RetryResearchButton } from "@/components/retry-research-button";

export default async function DeepResearchPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const tasks = await db
    .select()
    .from(researchTable)
    .where(eq(researchTable.userId, user.id))
    .orderBy(desc(researchTable.createdAt));

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary/10 text-primary rounded-xl">
          <Search className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-black font-heading tracking-tight text-gray-900 dark:text-white uppercase">Deep Research Logs</h1>
          <p className="text-gray-500 font-medium">Track your AI Research Agent's progress and view completed reports.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {tasks.length === 0 ? (
          <div className="text-center p-12 bg-gray-50 dark:bg-surface-variant/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-surface-variant">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No research tasks yet</h3>
            <p className="text-gray-500">Ask the AI on Telegram to "Research [topic]" to get started.</p>
          </div>
        ) : (
          tasks.map((task) => {
            const isStuck = (task.status === "pending" || task.status === "processing") && (new Date().getTime() - new Date(task.createdAt).getTime() > 10 * 60 * 1000);
            const isError = task.status === "error" || isStuck;
            
            return (
            <div key={task.id} className="bg-white dark:bg-surface-container border-[2px] border-black dark:border-surface-variant shadow-[4px_4px_0_0_#000] dark:shadow-none rounded-2xl overflow-hidden flex flex-col">
              <div className="p-5 border-b-[2px] border-black dark:border-surface-variant flex items-center justify-between bg-gray-50 dark:bg-surface-container-high">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-surface-variant rounded-lg border-2 border-black dark:border-transparent">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg font-heading line-clamp-1">{task.query}</h3>
                    <p className="text-xs text-gray-500 font-medium">{new Date(task.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div>
                  {!isError && (task.status === "pending" || task.status === "processing") ? (
                    <span className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 border-2 border-yellow-300 rounded-full text-xs font-bold uppercase tracking-wider">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      In Progress
                    </span>
                  ) : task.status === "completed" ? (
                    <span className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 border-2 border-green-300 rounded-full text-xs font-bold uppercase tracking-wider">
                      <CheckCircle className="w-4 h-4" />
                      Completed
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 border-2 border-red-300 rounded-full text-xs font-bold uppercase tracking-wider">
                      Failed
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-6 bg-white dark:bg-surface-container-lowest max-h-[500px] overflow-y-auto custom-scrollbar prose dark:prose-invert prose-headings:font-heading max-w-none">
                {isError ? (
                  <div className="flex flex-col items-center justify-center py-12 text-red-500">
                    <AlertCircle className="w-12 h-12 mb-4" />
                    <h4 className="text-lg font-bold mb-2">Research Failed</h4>
                    <p className="font-medium mb-6 text-center max-w-sm text-red-400">The Research Director encountered an error while synthesizing findings for this topic.</p>
                    <RetryResearchButton researchId={task.id} query={task.query} userId={task.userId} />
                  </div>
                ) : task.reportMarkdown ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{task.reportMarkdown}</ReactMarkdown>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-4" />
                    <p className="font-medium">The Research Director is synthesizing findings...</p>
                  </div>
                )}
              </div>
            </div>
          )})
        )}
      </div>
    </div>
  );
}
