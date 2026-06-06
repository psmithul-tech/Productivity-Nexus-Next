"use client";
import { useEffect, useState } from "react";
import { Briefcase, Target } from "lucide-react";

export default function RoadmapsPage() {
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoadmaps = async () => {
    try {
      const res = await fetch("/api/planner/roadmaps");
      if (res.ok) {
        const data = await res.json();
        setRoadmaps(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary-fixed to-secondary-fixed p-8 md:p-12 shadow-md">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm bg-on-primary-container/10 text-on-primary-container backdrop-blur-md border border-white/20">
              <Briefcase className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-on-primary-container/10 px-3 py-1 rounded-full text-[10px] font-bold text-on-primary-container uppercase tracking-widest border border-white/10">
                  Milestone Execution Plans
                </span>
              </div>
              <h1 className="font-headline-lg text-4xl sm:text-5xl font-bold text-on-primary-container tracking-tight">
                Strategic Roadmaps
              </h1>
            </div>
          </div>
        </div>
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-primary-container/30 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="island-card soft-glass rounded-[2rem] border-2 border-outline-variant/20 p-12 text-center col-span-full">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
            <p className="font-headline-sm text-lg text-on-surface-variant">Loading roadmaps...</p>
          </div>
        ) : roadmaps.length === 0 ? (
          <div className="island-card soft-glass rounded-[2rem] border-2 border-outline-variant/20 p-12 text-center col-span-full flex flex-col items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Target className="h-12 w-12 text-primary" />
            </div>
            <h3 className="font-headline-md text-2xl font-bold text-on-surface mb-3">No active roadmaps detected</h3>
            <p className="text-on-surface-variant text-base font-body-md">Initialize a strategic goal in the Chief Planner to generate roadmaps.</p>
          </div>
        ) : (
          roadmaps.map(roadmap => (
            <div key={roadmap.id} className="island-card soft-glass rounded-[2rem] border-2 border-outline-variant/20 p-6 sm:p-8 hover:border-primary/50 transition-all flex flex-col group">
              <div className="flex-1">
                <h4 className="text-on-surface font-headline-sm text-xl font-bold mb-3 group-hover:text-primary transition-colors">{roadmap.title}</h4>
                {roadmap.description && <p className="text-on-surface-variant font-body-sm text-sm line-clamp-3 mb-6 leading-relaxed">{roadmap.description}</p>}
              </div>
              
              <div className="mt-auto pt-6 border-t border-outline-variant/20">
                <p className="font-label-sm text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4 flex items-center justify-between">
                  <span>Target Milestones</span>
                  <span className="bg-surface-variant/50 px-2 py-0.5 rounded-full">{roadmap.milestones?.length || 0}</span>
                </p>
                <div className="space-y-2">
                  {roadmap.milestones?.map((m: any) => (
                    <div key={m.id} className="font-body-sm text-on-surface text-sm flex items-start gap-3 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0 shadow-sm animate-pulse"></span>
                      <span className="line-clamp-2">{m.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
