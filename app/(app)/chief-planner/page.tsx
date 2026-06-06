"use client";
import { useEffect, useState } from "react";
import { Map, Plus, Target, CheckCircle2, Circle, BrainCircuit, X, Copy, UploadCloud } from "lucide-react";

export default function ChiefPlannerDashboard() {
  const [goals, setGoals] = useState<any[]>([]);

  // AI Wizard State
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [userContext, setUserContext] = useState("");
  const [aiJson, setAiJson] = useState("");
  const [importing, setImporting] = useState(false);

  const generatedPrompt = `Act as an elite Chief Planner and Strategic Architect. I need to achieve the following objective:

=== OBJECTIVE ===
${userContext}
=================

You must create a highly granular, exhaustive, and rigorously detailed execution plan. 
Do NOT generate a generic or high-level summary. I want a deep, step-by-step breakdown:
1. Break the goal down into multiple comprehensive "roadmaps" (major phases).
2. For each roadmap, generate numerous specific "milestones" that act as clear progress markers.
3. Generate a massive list of highly specific "tasks" (micro-actions) needed to hit each milestone. Detail the exact steps, prerequisites, and instructions in the task descriptions. 
4. Schedule realistic "events" (time blocks/deep work sessions) to execute these tasks.

Return ONLY raw JSON strictly adhering to the following schema, with NO markdown formatting, NO backticks, and NO conversational text.

{
  "goal": {
    "title": "Actionable, precise goal title",
    "description": "In-depth explanation of the goal's importance, scope, and ultimate vision.",
    "deadline": "YYYY-MM-DDThh:mm:ssZ"
  },
  "roadmaps": [
    {
      "title": "Phase 1: [Specific Phase Name]",
      "description": "Detailed breakdown of what this phase entails, why it's necessary, and the expected outcomes.",
      "milestones": [
        { "title": "Clear, measurable milestone definition", "dueDate": "YYYY-MM-DDThh:mm:ssZ" }
      ]
    }
  ],
  "tasks": [
    { 
      "title": "Micro-action title (e.g. 'Draft chapter 1 outline')", 
      "description": "Exhaustive details: exactly how to do it, tools to use, and potential pitfalls to avoid.", 
      "dueDate": "YYYY-MM-DDThh:mm:ssZ", 
      "priority": "high", 
      "bucket": "today" 
    }
  ],
  "events": [
    { 
      "title": "Deep work session: [Topic]", 
      "description": "Detailed agenda for this time block.", 
      "startTime": "YYYY-MM-DDThh:mm:ssZ", 
      "endTime": "YYYY-MM-DDThh:mm:ssZ" 
    }
  ]
}`;

  const fetchGoals = async () => {
    try {
      const res = await fetch("/api/planner/goals");
      if (res.ok) {
        const data = await res.json();
        setGoals(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(generatedPrompt);
    setWizardStep(3);
  };

  const submitAiPlan = async () => {
    if (!aiJson.trim()) return;
    setImporting(true);
    try {
      let parsed = JSON.parse(aiJson);
      const res = await fetch("/api/planner/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      if (res.ok) {
        setWizardOpen(false);
        setWizardStep(1);
        setUserContext("");
        setAiJson("");
        fetchGoals();
      } else {
        alert("Failed to import plan. Check JSON structure.");
      }
    } catch (e) {
      alert("Invalid JSON structure. Please ensure it is raw JSON.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[32px] bg-[#118AB2] dark:bg-primary-container p-8 md:p-12 border-[3px] border-black dark:border-transparent shadow-[0_4px_0_0_#000] dark:shadow-md">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white dark:bg-on-primary-container/10 text-black dark:text-on-primary-container border-[3px] border-black dark:border-transparent shadow-[0_4px_0_0_#000] dark:shadow-sm">
              <Map className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-white dark:bg-on-primary-container/10 px-3 py-1 rounded-full text-[10px] font-bold text-black dark:text-on-primary-container uppercase tracking-widest border-[2px] border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-none">
                  Strategic Goal Mapping
                </span>
              </div>
              <h1 className="font-headline-lg text-4xl sm:text-5xl font-bold text-black dark:text-on-primary-container tracking-tight">
                Chief Planner
              </h1>
            </div>
          </div>
          <button 
            onClick={() => setWizardOpen(true)} 
            className="flex items-center gap-2 px-6 py-4 rounded-xl bg-white dark:bg-primary text-black dark:text-on-primary font-bold border-[3px] border-black dark:border-transparent shadow-[0_4px_0_0_#000] dark:shadow-lg hover:-translate-y-[2px] hover:shadow-[0_4px_0_0_#000] dark:hover:shadow-md transition-all shrink-0"
          >
            <BrainCircuit className="h-5 w-5" />
            <span>Plan with AI</span>
          </button>
        </div>
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-white/20 dark:bg-primary-container/30 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Empty State */}
      {goals.length === 0 && (
        <div className="bg-white dark:bg-surface rounded-[32px] border-[3px] border-black dark:border-outline-variant/20 p-12 text-center flex flex-col items-center justify-center mt-8 shadow-[0_4px_0_0_#000] dark:shadow-sm">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <BrainCircuit className="h-12 w-12 text-primary" />
          </div>
          <h3 className="font-headline-md text-2xl font-bold text-on-surface mb-3">No Active Operations</h3>
          <p className="text-on-surface-variant text-base max-w-lg mb-8 font-body-md leading-relaxed">
            Chief Planner operates exclusively through AI intelligence. Describe your target objective, and the neural net will orchestrate a complete structured plan.
          </p>
          <button 
            onClick={() => setWizardOpen(true)} 
            className="flex items-center gap-2 px-8 py-4 rounded-xl bg-white dark:bg-primary text-black dark:text-on-primary font-bold border-[3px] border-black dark:border-transparent shadow-[0_4px_0_0_#000] dark:shadow-lg hover:-translate-y-[2px] transition-all"
          >
            <BrainCircuit className="h-5 w-5" />
            <span>Initialize AI Planner</span>
          </button>
        </div>
      )}

      {/* Goals Grid */}
      {goals.length > 0 && (
        <div className="space-y-6 mt-12">
          <div className="flex flex-col gap-2">
            <h3 className="font-headline-md text-2xl font-bold text-on-surface flex items-center gap-3">
              <Target className="h-6 w-6 text-primary" /> Active Operations
            </h3>
            <p className="font-body-md text-on-surface-variant">Manage your strategic goals and track their progress.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map(goal => (
              <div 
                key={goal.id} 
                onClick={() => window.location.href = `/chief-planner/goals/${goal.id}`} 
                className="bg-white dark:bg-surface rounded-[32px] border-[3px] border-black dark:border-outline-variant/20 p-6 sm:p-8 cursor-pointer relative overflow-hidden flex flex-col shadow-[0_4px_0_0_#000] dark:shadow-sm hover:-translate-y-[2px] hover:shadow-[0_6px_0_0_#000] dark:hover:shadow-md transition-all group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="flex-1 relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Map className="h-6 w-6" />
                    </div>
                    <span className={`px-3 py-1 text-[10px] font-bold rounded-full flex items-center gap-1.5 border uppercase tracking-wider ${
                        goal.status === 'active' 
                          ? 'bg-primary/10 text-primary border-primary/20' 
                          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      }`}>
                        {goal.status === 'active' ? <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> : <CheckCircle2 className="h-3 w-3" />}
                        {goal.status}
                    </span>
                  </div>

                  <h4 className="text-on-surface font-headline-sm text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">{goal.title}</h4>
                  
                  {goal.description && <p className="text-on-surface-variant font-body-sm text-sm line-clamp-3 mb-6 leading-relaxed">{goal.description}</p>}
                </div>
                
                <div className="pt-4 border-t border-outline-variant/20 mt-auto relative z-10 flex items-center justify-between">
                  <span className="font-label-sm text-xs text-on-surface-variant flex items-center gap-2">
                    <Map className="h-4 w-4" /> {goal.roadmaps?.length || 0} Roadmaps
                  </span>
                  <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors">
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Wizard Modal */}
      {wizardOpen && typeof document !== 'undefined' && require('react-dom').createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 dark:bg-background/95 backdrop-blur-md p-4 sm:p-8">
          <div className="bg-white dark:bg-surface rounded-[32px] border-[3px] border-black dark:border-outline-variant/20 w-full max-w-2xl p-8 space-y-6 max-h-[90vh] flex flex-col shadow-[0_8px_0_0_#000] dark:shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between shrink-0 mb-2 border-b border-outline-variant/20 pb-6 relative z-10">
              <h3 className="font-headline-md text-2xl font-bold text-on-surface flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                Neural Planner
              </h3>
              <button onClick={() => { setWizardOpen(false); setWizardStep(1); }} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-8 relative z-10 custom-scrollbar">
              {wizardStep === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                    Phase 01: Directive
                  </div>
                  <p className="text-on-surface-variant font-body-md text-base">Define your objective. Include constraints, timeline, and specific parameters.</p>
                  <textarea 
                    value={userContext}
                    onChange={e => setUserContext(e.target.value)}
                    placeholder="I want to learn French enough to converse in Paris by next October. I have 30 minutes a day and free weekends."
                    className="flex min-h-[180px] w-full rounded-2xl border-[2px] border-black dark:border-outline-variant/30 px-6 py-5 text-base font-body-md bg-[#F0F4F8] dark:bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none shadow-inner"
                  />
                  <button 
                    onClick={() => setWizardStep(2)} 
                    disabled={!userContext.trim()}
                    className="w-full py-4 rounded-xl bg-white dark:bg-primary text-black dark:text-on-primary font-bold border-[3px] border-black dark:border-transparent hover:-translate-y-[2px] transition-all shadow-[0_4px_0_0_#000] dark:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-base"
                  >
                    Generate Prompt
                  </button>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                    Phase 02: Execution
                  </div>
                  <p className="text-on-surface-variant font-body-md text-base">Copy this prompt and feed it to an external neural net (ChatGPT/Claude).</p>
                  <div className="relative group">
                    <pre className="p-6 bg-[#F0F4F8] dark:bg-surface-container-lowest border-[2px] border-black dark:border-outline-variant/30 rounded-2xl font-mono text-xs text-on-surface-variant overflow-x-auto whitespace-pre-wrap selection:bg-primary/30 shadow-inner">
                      {generatedPrompt}
                    </pre>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <button onClick={() => setWizardStep(1)} className="flex-1 py-4 rounded-xl bg-white dark:bg-surface-container text-black dark:text-on-surface-variant font-bold border-[3px] border-black dark:border-transparent transition-colors hover:-translate-y-[2px] shadow-[0_4px_0_0_#000] dark:shadow-none">Abort</button>
                    <button onClick={copyPrompt} className="flex-[2] py-4 rounded-xl bg-[#06D6A0] dark:bg-primary text-black dark:text-on-primary font-bold border-[3px] border-black dark:border-transparent hover:-translate-y-[2px] transition-all shadow-[0_4px_0_0_#000] dark:shadow-lg flex items-center justify-center gap-2">
                      <Copy className="h-5 w-5" /> Copy Prompt & Next
                    </button>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                    Phase 03: Integration
                  </div>
                  <p className="text-on-surface-variant font-body-md text-base">Paste the raw JSON payload generated by the neural net.</p>
                  <textarea 
                    value={aiJson}
                    onChange={e => setAiJson(e.target.value)}
                    placeholder='{\n  "goal": {\n    "title": "..."\n  }\n}'
                    className="flex min-h-[250px] w-full rounded-2xl border-[2px] border-black dark:border-outline-variant/30 px-6 py-5 text-sm font-mono bg-[#F0F4F8] dark:bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none shadow-inner"
                  />
                  <div className="flex gap-4 pt-2">
                    <button onClick={() => setWizardStep(2)} className="flex-1 py-4 rounded-xl bg-white dark:bg-surface-container text-black dark:text-on-surface-variant font-bold border-[3px] border-black dark:border-transparent transition-colors hover:-translate-y-[2px] shadow-[0_4px_0_0_#000] dark:shadow-none">Abort</button>
                    <button 
                      onClick={submitAiPlan} 
                      disabled={importing || !aiJson.trim()}
                      className="flex-[2] py-4 rounded-xl bg-[#06D6A0] dark:bg-primary text-black dark:text-on-primary font-bold border-[3px] border-black dark:border-transparent hover:-translate-y-[2px] transition-all shadow-[0_4px_0_0_#000] dark:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {importing ? "Importing..." : <><UploadCloud className="h-5 w-5" /> Inject Payload</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
