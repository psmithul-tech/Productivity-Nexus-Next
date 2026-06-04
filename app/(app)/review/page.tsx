"use client";
import { useEffect, useState } from "react";
import { Sparkles, Loader2, Target, CheckCircle2, Flame, Award } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

export default function WeeklyReviewPage() {
  const [data, setData] = useState<{ text: string; stats: any } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReview() {
      try {
        const res = await fetch("/api/review");
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setData(json);
      } catch (e) {
        toast.error("Could not generate review");
      } finally {
        setLoading(false);
      }
    }
    fetchReview();
  }, []);

  return (
    <div className="relative min-h-screen pb-12">
      <div className="fixed top-[20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8 py-8">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 shadow-2xl shadow-purple-500/20 mb-6">
            <Award className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Weekly Retrospective</h1>
          <p className="text-white/40">AI-powered analysis of your last 7 days.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-purple-400" />
            <p className="text-sm font-medium text-purple-400 animate-pulse">Analyzing your week...</p>
          </div>
        ) : !data ? (
          <div className="text-center py-20 text-white/50">Failed to load data.</div>
        ) : (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col items-center text-center backdrop-blur-xl">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-3" />
                <p className="text-3xl font-black text-white">{data.stats.tasks}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-white/40 mt-1">Tasks Completed</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col items-center text-center backdrop-blur-xl">
                <Target className="h-8 w-8 text-blue-400 mb-3" />
                <p className="text-3xl font-black text-white">{Math.round(data.stats.focusMinutes / 60 * 10) / 10}h</p>
                <p className="text-xs font-bold uppercase tracking-wider text-white/40 mt-1">Deep Work</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col items-center text-center backdrop-blur-xl">
                <Flame className="h-8 w-8 text-orange-400 mb-3" />
                <p className="text-3xl font-black text-white">{data.stats.habits}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-white/40 mt-1">Habits Logged</p>
              </div>
            </div>

            {/* AI Review Text */}
            <div className="rounded-3xl border border-purple-500/30 bg-purple-500/5 p-8 sm:p-10 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500" />
              <div className="flex items-center gap-2 text-purple-400 mb-6">
                <Sparkles className="h-5 w-5" />
                <h2 className="text-sm font-bold tracking-widest uppercase">AI Coach Insights</h2>
              </div>
              <div className="prose prose-invert prose-p:leading-relaxed prose-p:text-white/80 prose-strong:text-white max-w-none">
                <ReactMarkdown>{data.text}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
