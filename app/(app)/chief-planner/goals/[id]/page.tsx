"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, Map, Trash2 } from "lucide-react";

export default function GoalDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [goal, setGoal] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/planner/goals/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setGoal(d))
      .catch(console.error);
  }, [id]);

  const deleteGoal = async () => {
    if (!confirm("Are you sure you want to delete this goal and all its roadmaps?")) return;
    await fetch(`/api/planner/goals/${id}`, { method: "DELETE" });
    router.push("/chief-planner");
  };

  if (!goal) return (
    <div className="p-12 text-center flex flex-col items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
      <span className="font-mono-label text-xs text-on-surface-variant uppercase tracking-widest">Loading Neural Payload...</span>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24">
      <button 
        onClick={() => router.push("/chief-planner")} 
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-bold text-sm transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Overview</span>
      </button>

      <div className="island-card soft-glass rounded-[2rem] border-2 border-outline-variant/20 p-8 sm:p-12 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-primary/10 px-3 py-1 rounded-full text-[10px] font-bold text-primary uppercase tracking-widest border border-primary/20">
              Strategic Goal
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-headline-lg font-bold text-on-surface tracking-tight mb-4">
            {goal.title}
          </h1>
          {goal.description && <p className="text-on-surface-variant font-body-lg text-lg leading-relaxed max-w-3xl">{goal.description}</p>}
        </div>
        <button 
          onClick={deleteGoal} 
          className="relative z-10 shrink-0 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center gap-2 transition-colors shadow-sm"
        >
          <Trash2 className="h-4 w-4" /> Terminate
        </button>
      </div>

      <div className="mt-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Map className="h-5 w-5" />
          </div>
          <h3 className="font-headline-md text-2xl font-bold text-on-surface">
            Execution Roadmaps
          </h3>
        </div>
        
        {goal.roadmaps?.length === 0 ? (
          <div className="island-card soft-glass rounded-[2rem] border-2 border-outline-variant/20 p-12 text-center">
            <p className="font-headline-sm text-lg text-on-surface-variant">No roadmaps defined for this goal yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {goal.roadmaps?.map((roadmap: any) => (
              <div key={roadmap.id} className="island-card soft-glass rounded-[2rem] border-2 border-outline-variant/20 p-6 sm:p-8">
                <h4 className="text-xl font-headline-sm font-bold text-on-surface mb-2">{roadmap.title}</h4>
                {roadmap.description && <p className="text-on-surface-variant font-body-md text-base mb-6 leading-relaxed">{roadmap.description}</p>}
                
                <div className="space-y-3 mt-6 pt-6 border-t border-outline-variant/20">
                  {roadmap.milestones?.map((ms: any) => (
                    <div key={ms.id} className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 hover:border-primary/40 transition-colors shadow-sm">
                      {ms.status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-primary/50 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`font-body-md text-base font-medium ${ms.status === 'completed' ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}>{ms.title}</p>
                      </div>
                      {ms.dueDate && (
                        <span className="font-bold text-xs text-on-surface-variant bg-surface-variant/50 px-3 py-1.5 rounded-full shrink-0 border border-outline-variant/20">
                          {new Date(ms.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
