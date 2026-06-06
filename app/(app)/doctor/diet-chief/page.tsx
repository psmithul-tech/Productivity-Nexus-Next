"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Utensils, Zap, Flame, Droplets, Wheat, BrainCircuit, X, CheckCircle2, Apple, PlusCircle, Activity, ImagePlus } from "lucide-react";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";

const queryClient = new QueryClient();

export default function DietPlannerPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <DietPlannerContent />
    </QueryClientProvider>
  );
}

function DietPlannerContent() {
  const queryClient = useQueryClient();
  
  // Wizard States
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  
  // Workflow States
  const [context, setContext] = useState("");
  const [duration, setDuration] = useState(7);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [payload, setPayload] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);

  // AI Meal Logger States
  const [aiLogOpen, setAiLogOpen] = useState(false);
  const [aiMealDesc, setAiMealDesc] = useState("");
  const [aiMealImage, setAiMealImage] = useState<string | null>(null);
  const [aiMealResult, setAiMealResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Edit Meal States
  const [editMealOpen, setEditMealOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<any>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setAiMealImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const importPayloadMutation = useMutation({
    mutationFn: async () => {
      const parsed = JSON.parse(payload);
      const res = await fetch("/api/diet/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed)
      });
      if (!res.ok) throw new Error("Failed to import diet data");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dietGoals"] });
      if (data.plan) {
        setGeneratedPlan(data.plan);
      }
      toast.success("Diet Architect payload injected successfully!");
      setWizardOpen(false);
      setWizardStep(1);
      setPayload("");
    },
    onError: () => toast.error("Invalid JSON payload or server error")
  });

  const handleGeneratePrompt = () => {
    const prompt = `Act as an elite Nutritional Architect and Dietitian. 
Analyze the following context regarding my physical profile and dietary goals:
"""
${context}
"""

Task 1: Calculate my daily macro targets (Calories, Protein, Carbs, Fat) based on my goals.
Task 2: If a meal plan was requested in the context, orchestrate a highly structured day-by-day meal plan that hits these exact daily macros for ${duration} days. If ${duration} is large (e.g. 14 or 28), you may provide a 7-day repeatable schedule that the user can repeat.

You MUST respond ONLY with a raw JSON object using exactly this schema. Do not include markdown code blocks or any other text.
{
  "goals": {
    "targetCalories": 2200,
    "targetProtein": 160,
    "targetCarbs": 200,
    "targetFat": 65
  },
  "plan": {
    "title": "${duration}-Day Aggressive Cut (Vegetarian)",
    "days": [
      {
        "day": "Day 1",
        "meals": [
          {
            "type": "Breakfast",
            "name": "Oatmeal",
            "description": "Quick prep oats with berries",
            "calories": 300,
            "protein": 15,
            "carbs": 40,
            "fat": 5
          }
        ]
      }
    ]
  }
}
Note: If no meal plan is needed, you can omit the "plan" key or set it to null.`;
    setGeneratedPrompt(prompt);
    setWizardStep(2);
  };

  // Fetch today's logs
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: logsData, isLoading: loadingLogs } = useQuery({
    queryKey: ["dietLogs", today],
    queryFn: async () => {
      const res = await fetch(`/api/diet/log?date=${today}&timezone=${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    }
  });

  // Fetch goals
  const { data: goalsData, isLoading: loadingGoals } = useQuery({
    queryKey: ["dietGoals"],
    queryFn: async () => {
      const res = await fetch(`/api/diet/goals`);
      if (!res.ok) throw new Error("Failed to fetch goals");
      return res.json();
    }
  });

  // Fetch history
  const { data: historyData, isLoading: loadingHistory } = useQuery({
    queryKey: ["dietHistory"],
    queryFn: async () => {
      const res = await fetch(`/api/diet/history?days=7`);
      if (!res.ok) throw new Error("Failed to fetch history");
      return res.json();
    }
  });

  const logs = logsData?.logs || [];
  const goals = goalsData?.goals || { targetCalories: 2000, targetProtein: 150, targetCarbs: 200, targetFat: 65 };

  // Calculate totals
  const totalCal = logs.reduce((acc: number, l: any) => acc + l.calories, 0);
  const totalPro = logs.reduce((acc: number, l: any) => acc + l.protein, 0);
  const totalCarbs = logs.reduce((acc: number, l: any) => acc + l.carbs, 0);
  const totalFat = logs.reduce((acc: number, l: any) => acc + l.fat, 0);

  // Log Meal Mutation
  const saveMealMutation = useMutation({
    mutationFn: async (meal: any) => {
      const res = await fetch("/api/diet/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meal)
      });
      if (!res.ok) throw new Error("Failed to log meal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dietLogs", today] });
      queryClient.invalidateQueries({ queryKey: ["dietHistory"] });
      toast.success("Meal logged successfully!");
      setAiLogOpen(false);
      setAiMealDesc("");
      setAiMealResult(null);
    }
  });

  const updateMealMutation = useMutation({
    mutationFn: async (meal: any) => {
      const res = await fetch(`/api/diet/log/${meal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meal)
      });
      if (!res.ok) throw new Error("Failed to update meal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dietLogs", today] });
      queryClient.invalidateQueries({ queryKey: ["dietHistory"] });
      toast.success("Meal updated successfully!");
      setEditMealOpen(false);
    }
  });

  const deleteMealMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/diet/log/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete meal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dietLogs", today] });
      queryClient.invalidateQueries({ queryKey: ["dietHistory"] });
      toast.success("Meal deleted successfully!");
      setEditMealOpen(false);
    }
  });

  const analyzeMeal = async () => {
    if (!aiMealDesc.trim() && !aiMealImage) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/diet/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textDescription: aiMealDesc, imageBase64: aiMealImage })
      });
      if (!res.ok) throw new Error("Failed to analyze meal");
      const data = await res.json();
      setAiMealResult(data);
    } catch (e) {
      toast.error("Failed to analyze meal with AI.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const MacroCard = ({ title, current, target, icon: Icon, color }: any) => {
    const percent = Math.min(Math.round((current / target) * 100), 100);
    return (
      <div className="bg-white dark:bg-surface rounded-[32px] border-[3px] border-black dark:border-outline-variant/20 shadow-[0_4px_0_0_#000] dark:shadow-sm p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
        <div className={`w-12 h-12 rounded-full mb-4 flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="font-label-md text-on-surface-variant mb-1 uppercase tracking-widest">{title}</h3>
        <div className="font-display-md text-3xl font-bold text-on-surface mb-1">
          {current} <span className="text-lg text-on-surface-variant font-normal">/ {target}</span>
        </div>
        <div className="w-full bg-surface-container h-2 rounded-full mt-4 overflow-hidden">
          <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${percent}%` }} />
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24">
      {/* Header (Chief Planner Style) */}
      <div className="relative overflow-hidden rounded-[32px] bg-[#FFD166] dark:bg-primary-container p-8 md:p-12 border-[3px] border-black dark:border-transparent shadow-[0_4px_0_0_#000] dark:shadow-md">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white dark:bg-on-primary-container/10 text-black dark:text-on-primary-container border-[3px] border-black dark:border-transparent shadow-[0_4px_0_0_#000] dark:shadow-sm">
              <Apple className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-white dark:bg-on-primary-container/10 px-3 py-1 rounded-full text-[10px] font-bold text-black dark:text-on-primary-container uppercase tracking-widest border-[2px] border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-none">
                  Nutritional Architecture
                </span>
              </div>
              <h1 className="font-headline-lg text-4xl sm:text-5xl font-bold text-black dark:text-on-primary-container tracking-tight">
                Diet Chief
              </h1>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => { setWizardStep(1); setWizardOpen(true); }} 
              className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white dark:bg-primary text-black dark:text-on-primary font-bold border-[3px] border-black dark:border-transparent hover:-translate-y-[2px] transition-all shadow-[0_4px_0_0_#000] dark:shadow-lg shrink-0 text-lg"
            >
              <BrainCircuit className="h-6 w-6" />
              <span>Orchestrate Diet Plan</span>
            </button>
          </div>
        </div>
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-white/20 dark:bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Macros Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MacroCard title="Calories" current={totalCal} target={goals.targetCalories} icon={Zap} color="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" />
        <MacroCard title="Protein" current={totalPro} target={goals.targetProtein} icon={Flame} color="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" />
        <MacroCard title="Carbs" current={totalCarbs} target={goals.targetCarbs} icon={Wheat} color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
        <MacroCard title="Fats" current={totalFat} target={goals.targetFat} icon={Droplets} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
      </div>

      {/* Weekly Progress Review */}
      <div className="mt-12 space-y-6">
        <div className="flex flex-col gap-2">
          <h3 className="font-headline-md text-2xl font-bold text-on-surface flex items-center gap-3">
            <Activity className="h-6 w-6 text-primary" /> Weekly Progress Review
          </h3>
          <p className="font-body-md text-on-surface-variant">Caloric intake against target over the last 7 days.</p>
        </div>
        
        <div className="bg-white dark:bg-surface rounded-[32px] border-[3px] border-black dark:border-outline-variant/20 shadow-[0_4px_0_0_#000] dark:shadow-sm p-6 sm:p-8 h-[400px]">
          {loadingHistory ? (
            <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : historyData?.history && historyData.history.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historyData.history} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-outline-variant/20" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => format(new Date(val), "EEE")}
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ className: 'fill-on-surface-variant font-label-sm text-xs' }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ className: 'fill-on-surface-variant font-label-sm text-xs' }} 
                />
                <Tooltip 
                  cursor={{ fill: 'currentColor', className: 'text-primary/5' }}
                  contentStyle={{ borderRadius: '16px', border: '2px solid black', boxShadow: '0 4px 0 0 #000', backgroundColor: '#fff', color: '#000' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
                  formatter={(value: any) => [`${value} kcal`, 'Calories']}
                  labelFormatter={(label) => format(new Date(label as string), "MMM d, yyyy")}
                />
                <ReferenceLine y={goals.targetCalories} stroke="#ef4444" strokeDasharray="3 3" />
                <Bar dataKey="calories" fill="#FFD166" radius={[8, 8, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-on-surface-variant">No data available.</div>
          )}
        </div>
      </div>

      {/* Active AI Meal Plan */}
      {generatedPlan && (
        <div className="mt-12 space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col gap-2">
            <h3 className="font-headline-md text-2xl font-bold text-on-surface flex items-center gap-3">
              <BrainCircuit className="h-6 w-6 text-primary" /> Generated Master Plan
            </h3>
            <p className="font-body-md text-on-surface-variant">{generatedPlan.title}</p>
          </div>
          
          <div className="space-y-8">
            {generatedPlan.days.map((day: any, idx: number) => (
              <div key={idx} className="bg-white dark:bg-surface rounded-[32px] border-[3px] border-black dark:border-outline-variant/20 shadow-[0_4px_0_0_#000] dark:shadow-sm p-6 sm:p-8">
                <h4 className="font-display-sm text-xl text-primary font-bold mb-6 border-b border-outline-variant/20 pb-4">{day.day}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {day.meals.map((meal: any, mIdx: number) => (
                    <div key={mIdx} className="bg-[#F0F4F8] dark:bg-surface-container-lowest rounded-2xl p-6 border-[2px] border-black dark:border-outline-variant/20 shadow-[0_2px_0_0_#000] dark:shadow-none relative group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-3 py-1 bg-surface-container text-on-surface-variant rounded-full text-[10px] font-bold uppercase tracking-widest">{meal.type}</span>
                        <button 
                          onClick={() => {
                            saveMealMutation.mutate({
                              mealType: meal.type,
                              foodItems: [meal.name],
                              calories: meal.calories,
                              protein: meal.protein,
                              carbs: meal.carbs,
                              fat: meal.fat
                            });
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-on-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 hover:bg-primary/90"
                        >
                          <PlusCircle className="w-3 h-3" /> Log Meal
                        </button>
                      </div>
                      <h5 className="font-headline-sm text-lg font-bold text-on-surface mb-2">{meal.name}</h5>
                      <p className="text-on-surface-variant font-body-sm mb-4 leading-relaxed">{meal.description}</p>
                      
                      <div className="flex gap-4 text-xs font-label-md text-on-surface-variant border-t border-outline-variant/20 pt-4 mt-auto">
                        <span className="font-bold text-on-surface">{meal.calories} kcal</span>
                        <span>P: {meal.protein}g</span>
                        <span>C: {meal.carbs}g</span>
                        <span>F: {meal.fat}g</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Logs Timeline */}
      <div className="mt-12 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="font-headline-md text-2xl font-bold text-on-surface flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-primary" /> Today's Execution
          </h3>
          <button
            onClick={() => setAiLogOpen(true)}
            className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl font-bold hover:-translate-y-1 transition-all shadow-[0_2px_0_0_#000] dark:shadow-sm"
          >
            <BrainCircuit className="w-5 h-5" /> Log Meal with AI
          </button>
        </div>
        
        {loadingLogs ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : logs.length === 0 ? (
          <div className="bg-white dark:bg-surface rounded-[32px] border-[3px] border-black dark:border-outline-variant/20 shadow-[0_4px_0_0_#000] dark:shadow-sm p-12 text-center">
            <Utensils className="w-12 h-12 text-outline mx-auto mb-4" />
            <h3 className="font-display-sm text-xl text-on-surface mb-2">No meals logged yet</h3>
            <p className="text-on-surface-variant mb-6">Generate an AI meal plan and log your meals to track your execution.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {logs.map((log: any) => (
              <div 
                key={log.id} 
                onClick={() => { 
                  setEditingMeal({
                    ...log,
                    foodItems: typeof log.foodItems === 'string' ? JSON.parse(log.foodItems).join(', ') : log.foodItems?.join(', '),
                    loggedAt: new Date(log.loggedAt).toISOString().slice(0, 16)
                  }); 
                  setEditMealOpen(true); 
                }}
                className="bg-white dark:bg-surface border-[3px] border-black dark:border-outline-variant/20 rounded-[32px] p-6 shadow-[0_4px_0_0_#000] dark:shadow-sm hover:translate-y-[-2px] hover:shadow-[0_6px_0_0_#000] dark:hover:shadow-md transition-all cursor-pointer relative group"
              >
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-on-primary px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
                  Edit
                </div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="font-label-sm uppercase tracking-widest text-primary mb-1 block">{log.mealType}</span>
                    <h3 className="font-display-sm text-xl text-on-surface">{log.calories} kcal</h3>
                  </div>
                  <span className="text-on-surface-variant font-label-sm">{format(new Date(log.loggedAt), "h:mm a")}</span>
                </div>
                <p className="text-on-surface-variant font-body-md mb-4 line-clamp-2">
                  {typeof log.foodItems === 'string' ? JSON.parse(log.foodItems).join(', ') : log.foodItems?.join(', ') || 'Unknown meal'}
                </p>
                <div className="flex gap-4 text-sm font-label-md text-on-surface-variant border-t border-outline-variant/20 pt-4">
                  <span>P: {log.protein}g</span>
                  <span>C: {log.carbs}g</span>
                  <span>F: {log.fat}g</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Wizards Modal */}
      {wizardOpen && typeof document !== 'undefined' && require('react-dom').createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 dark:bg-background/95 backdrop-blur-md p-4 sm:p-8">
          <div className="bg-white dark:bg-surface rounded-[32px] border-[3px] border-black dark:border-outline-variant/20 w-full max-w-2xl p-8 space-y-6 max-h-[90vh] flex flex-col shadow-[0_8px_0_0_#000] dark:shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between shrink-0 mb-2 border-b border-outline-variant/20 pb-6 relative z-10">
              <h3 className="font-headline-md text-2xl font-bold text-on-surface flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                Diet Architect
              </h3>
              <button onClick={() => setWizardOpen(false)} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-8 relative z-10 custom-scrollbar">
              {wizardStep === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                    Phase 1: Directive
                  </div>
                  <p className="text-on-surface-variant font-body-md text-base">Describe your physical profile, objectives, and any meal plan preferences. The Architect will craft a prompt for you.</p>
                  
                  <div className="flex flex-col gap-2">
                    <label className="font-label-md text-on-surface-variant uppercase tracking-widest text-xs">Plan Duration</label>
                    <div className="flex gap-2">
                      {[7, 14, 28].map(d => (
                        <button
                          key={d}
                          onClick={() => setDuration(d)}
                          className={`flex-1 py-2 rounded-xl border-[2px] font-bold transition-all ${duration === d ? 'bg-primary text-on-primary border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-md' : 'bg-surface border-outline-variant/30 text-on-surface-variant hover:bg-surface-container'}`}
                        >
                          {d} Days
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea 
                    value={context}
                    onChange={e => setContext(e.target.value)}
                    placeholder="I am a 180lb male cutting weight. Give me my calorie targets and a 2-day high-protein vegetarian meal plan."
                    className="flex min-h-[180px] w-full rounded-2xl border-[2px] border-black dark:border-outline-variant/30 px-6 py-5 text-base font-body-md bg-[#F0F4F8] dark:bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none shadow-inner"
                  />
                  <div className="flex gap-4">
                    <button 
                      onClick={handleGeneratePrompt} 
                      disabled={!context.trim()}
                      className="w-full py-4 rounded-xl bg-white dark:bg-primary text-black dark:text-on-primary font-bold border-[3px] border-black dark:border-transparent hover:-translate-y-[2px] transition-all shadow-[0_4px_0_0_#000] dark:shadow-lg flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                      <BrainCircuit className="h-5 w-5" />
                      <span>Generate Architect Prompt</span>
                    </button>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                    Phase 2: Execution
                  </div>
                  <p className="text-on-surface-variant font-body-md text-base">Copy this prompt and paste it into ChatGPT, Claude, or any advanced AI.</p>
                  <div className="relative group">
                    <pre className="p-6 rounded-2xl bg-[#F0F4F8] dark:bg-surface-container-lowest border-[2px] border-black dark:border-outline-variant/30 text-sm font-mono text-on-surface-variant whitespace-pre-wrap shadow-inner overflow-y-auto max-h-[300px] custom-scrollbar">
                      {generatedPrompt}
                    </pre>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(generatedPrompt);
                        toast.success("Prompt copied to clipboard!");
                      }}
                      className="absolute top-4 right-4 p-2 bg-surface hover:bg-surface-container-highest border border-outline-variant/20 rounded-lg text-on-surface shadow-sm transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setWizardStep(1)} 
                      className="flex-[1] py-4 rounded-xl bg-white dark:bg-surface-container text-black dark:text-on-surface border-[3px] border-black dark:border-transparent hover:-translate-y-[2px] transition-all shadow-[0_4px_0_0_#000] dark:shadow-none font-bold"
                    >
                      Back
                    </button>
                    <button 
                      onClick={() => setWizardStep(3)}
                      className="flex-[2] py-4 rounded-xl bg-[#118AB2] dark:bg-primary text-white dark:text-on-primary font-bold border-[3px] border-black dark:border-transparent hover:-translate-y-[2px] transition-all shadow-[0_4px_0_0_#000] dark:shadow-lg"
                    >
                      Proceed to Integration
                    </button>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                    Phase 3: Integration
                  </div>
                  <p className="text-on-surface-variant font-body-md text-base">Paste the exact JSON response generated by the AI here to inject it into your timeline.</p>
                  <textarea 
                    value={payload}
                    onChange={e => setPayload(e.target.value)}
                    placeholder='{"goals": {...}, "plan": {...}}'
                    className="flex min-h-[200px] w-full rounded-2xl border-[2px] border-black dark:border-outline-variant/30 px-6 py-5 text-sm font-mono bg-[#F0F4F8] dark:bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none shadow-inner"
                  />
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setWizardStep(2)} 
                      className="flex-[1] py-4 rounded-xl bg-white dark:bg-surface-container text-black dark:text-on-surface border-[3px] border-black dark:border-transparent hover:-translate-y-[2px] transition-all shadow-[0_4px_0_0_#000] dark:shadow-none font-bold"
                    >
                      Back
                    </button>
                    <button 
                      onClick={() => importPayloadMutation.mutate()} 
                      disabled={!payload.trim() || importPayloadMutation.isPending}
                      className="flex-[2] py-4 rounded-xl bg-[#06D6A0] dark:bg-primary text-black dark:text-on-primary font-bold border-[3px] border-black dark:border-transparent hover:-translate-y-[2px] transition-all shadow-[0_4px_0_0_#000] dark:shadow-lg flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                      {importPayloadMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
                      <span>Inject Payload</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* AI Meal Logger Modal */}
      {aiLogOpen && typeof document !== 'undefined' && require('react-dom').createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 dark:bg-background/95 backdrop-blur-md p-4 sm:p-8">
          <div className="bg-white dark:bg-surface rounded-[32px] border-[3px] border-black dark:border-outline-variant/20 w-full max-w-lg p-8 space-y-6 max-h-[90vh] flex flex-col shadow-[0_8px_0_0_#000] dark:shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between shrink-0 mb-2 border-b border-outline-variant/20 pb-6 relative z-10">
              <h3 className="font-headline-md text-2xl font-bold text-on-surface flex items-center gap-3">
                <BrainCircuit className="h-6 w-6 text-primary" />
                Owl Bot Logger
              </h3>
              <button onClick={() => { setAiLogOpen(false); setAiMealDesc(""); setAiMealResult(null); }} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6 relative z-10 custom-scrollbar">
              {!aiMealResult ? (
                <div className="space-y-4">
                  <p className="text-on-surface-variant font-body-md text-base">Tell Owl Bot exactly what you ate, or upload a photo, and it will calculate your macros.</p>
                  <div className="flex flex-col gap-4">
                    <textarea
                      value={aiMealDesc}
                      onChange={e => setAiMealDesc(e.target.value)}
                      placeholder="I ate a bowl of oatmeal with a handful of blueberries and 2 scrambled eggs..."
                      className="flex min-h-[120px] w-full rounded-2xl border-[2px] border-black dark:border-outline-variant/30 px-6 py-5 text-base font-body-md bg-[#F0F4F8] dark:bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none shadow-inner"
                    />
                    
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer bg-surface-container hover:bg-surface-container-highest border-[2px] border-dashed border-outline-variant/50 px-4 py-3 rounded-xl transition-colors">
                        <ImagePlus className="w-5 h-5 text-primary" />
                        <span className="font-bold text-on-surface text-sm">Upload Photo</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                      {aiMealImage && (
                        <div className="relative w-16 h-16 rounded-xl border-2 border-outline-variant/20 overflow-hidden shrink-0">
                          <img src={aiMealImage} alt="Meal preview" className="w-full h-full object-cover" />
                          <button 
                            onClick={() => setAiMealImage(null)}
                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={analyzeMeal}
                    disabled={(!aiMealDesc.trim() && !aiMealImage) || isAnalyzing}
                    className="w-full py-4 rounded-xl bg-primary text-on-primary font-bold border-[3px] border-black dark:border-transparent hover:-translate-y-[2px] transition-all shadow-[0_4px_0_0_#000] dark:shadow-lg flex justify-center items-center gap-2 disabled:opacity-50"
                  >
                    {isAnalyzing ? <Loader2 className="h-5 w-5 animate-spin" /> : <BrainCircuit className="h-5 w-5" />}
                    <span>Analyze Meal</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in">
                  <div className="bg-[#F0F4F8] dark:bg-surface-container-lowest rounded-2xl p-6 border-[2px] border-black dark:border-outline-variant/30 shadow-inner">
                    <h4 className="font-display-sm text-lg font-bold text-on-surface mb-2">Analysis Complete</h4>
                    <p className="text-on-surface-variant font-body-sm mb-4">
                      {aiMealResult.foodItems?.join(", ")}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">Calories</span>
                        <span className="text-xl font-bold text-orange-600 dark:text-orange-400">{aiMealResult.calories}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">Protein</span>
                        <span className="text-xl font-bold text-red-600 dark:text-red-400">{aiMealResult.protein}g</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">Carbs</span>
                        <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{aiMealResult.carbs}g</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">Fat</span>
                        <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{aiMealResult.fat}g</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <button
                      onClick={() => setAiMealResult(null)}
                      className="flex-[1] py-4 rounded-xl bg-surface-container text-on-surface font-bold border-[3px] border-black dark:border-transparent hover:-translate-y-[2px] transition-all"
                    >
                      Retry
                    </button>
                    <button
                      onClick={() => saveMealMutation.mutate({
                        mealType: "AI Logged",
                        foodItems: aiMealResult.foodItems,
                        calories: aiMealResult.calories,
                        protein: aiMealResult.protein,
                        carbs: aiMealResult.carbs,
                        fat: aiMealResult.fat
                      })}
                      disabled={saveMealMutation.isPending}
                      className="flex-[2] py-4 rounded-xl bg-[#06D6A0] dark:bg-primary text-black dark:text-on-primary font-bold border-[3px] border-black dark:border-transparent hover:-translate-y-[2px] transition-all shadow-[0_4px_0_0_#000] dark:shadow-lg flex justify-center items-center gap-2"
                    >
                      {saveMealMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                      Log to Timeline
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Meal Modal */}
      {editMealOpen && editingMeal && typeof document !== 'undefined' && require('react-dom').createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 dark:bg-background/95 backdrop-blur-md p-4 sm:p-8">
          <div className="bg-white dark:bg-surface rounded-[32px] border-[3px] border-black dark:border-outline-variant/20 w-full max-w-lg p-8 space-y-6 max-h-[90vh] flex flex-col shadow-[0_8px_0_0_#000] dark:shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between shrink-0 mb-2 border-b border-outline-variant/20 pb-6 relative z-10">
              <h3 className="font-headline-md text-2xl font-bold text-on-surface flex items-center gap-3">
                <Utensils className="h-6 w-6 text-primary" />
                Edit Meal
              </h3>
              <button onClick={() => setEditMealOpen(false)} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6 relative z-10 custom-scrollbar">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Meal Type</label>
                    <select
                      value={editingMeal.mealType}
                      onChange={(e) => setEditingMeal({...editingMeal, mealType: e.target.value})}
                      className="w-full rounded-xl border-[2px] border-black dark:border-outline-variant/30 px-4 py-3 bg-[#F0F4F8] dark:bg-surface-container-lowest text-on-surface font-body-md focus:outline-none focus:ring-4 focus:ring-primary/10"
                    >
                      <option value="Breakfast">Breakfast</option>
                      <option value="Lunch">Lunch</option>
                      <option value="Dinner">Dinner</option>
                      <option value="Snack">Snack</option>
                      <option value="AI Logged">AI Logged</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Time</label>
                    <input
                      type="datetime-local"
                      value={editingMeal.loggedAt}
                      onChange={(e) => setEditingMeal({...editingMeal, loggedAt: e.target.value})}
                      className="w-full rounded-xl border-[2px] border-black dark:border-outline-variant/30 px-4 py-3 bg-[#F0F4F8] dark:bg-surface-container-lowest text-on-surface font-body-md focus:outline-none focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Food Items</label>
                  <textarea
                    value={editingMeal.foodItems}
                    onChange={(e) => setEditingMeal({...editingMeal, foodItems: e.target.value})}
                    className="flex min-h-[80px] w-full rounded-xl border-[2px] border-black dark:border-outline-variant/30 px-4 py-3 bg-[#F0F4F8] dark:bg-surface-container-lowest text-on-surface font-body-md focus:outline-none focus:ring-4 focus:ring-primary/10 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-orange-600 dark:text-orange-400">Calories</label>
                    <input
                      type="number"
                      value={editingMeal.calories}
                      onChange={(e) => setEditingMeal({...editingMeal, calories: e.target.value})}
                      className="w-full rounded-xl border-[2px] border-orange-500/30 px-3 py-2 bg-orange-50 dark:bg-orange-900/10 text-on-surface font-bold text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-red-600 dark:text-red-400">Protein</label>
                    <input
                      type="number"
                      value={editingMeal.protein}
                      onChange={(e) => setEditingMeal({...editingMeal, protein: e.target.value})}
                      className="w-full rounded-xl border-[2px] border-red-500/30 px-3 py-2 bg-red-50 dark:bg-red-900/10 text-on-surface font-bold text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-amber-600 dark:text-amber-400">Carbs</label>
                    <input
                      type="number"
                      value={editingMeal.carbs}
                      onChange={(e) => setEditingMeal({...editingMeal, carbs: e.target.value})}
                      className="w-full rounded-xl border-[2px] border-amber-500/30 px-3 py-2 bg-amber-50 dark:bg-amber-900/10 text-on-surface font-bold text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-blue-600 dark:text-blue-400">Fat</label>
                    <input
                      type="number"
                      value={editingMeal.fat}
                      onChange={(e) => setEditingMeal({...editingMeal, fat: e.target.value})}
                      className="w-full rounded-xl border-[2px] border-blue-500/30 px-3 py-2 bg-blue-50 dark:bg-blue-900/10 text-on-surface font-bold text-lg"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-outline-variant/20">
                  <button
                    onClick={() => {
                      if(confirm("Are you sure you want to delete this meal?")) {
                        deleteMealMutation.mutate(editingMeal.id);
                      }
                    }}
                    disabled={deleteMealMutation.isPending || updateMealMutation.isPending}
                    className="px-6 py-4 rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-bold hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => {
                      updateMealMutation.mutate({
                        ...editingMeal,
                        foodItems: editingMeal.foodItems.split(',').map((s: string) => s.trim()).filter(Boolean)
                      });
                    }}
                    disabled={deleteMealMutation.isPending || updateMealMutation.isPending}
                    className="flex-1 py-4 rounded-xl bg-primary text-on-primary font-bold border-[3px] border-black dark:border-transparent hover:-translate-y-[2px] transition-all shadow-[0_4px_0_0_#000] dark:shadow-lg flex justify-center items-center gap-2"
                  >
                    {updateMealMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
