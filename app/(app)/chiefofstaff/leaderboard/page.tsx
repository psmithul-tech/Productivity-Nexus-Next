"use client";
import { useEffect, useState } from "react";
import { Trophy, Globe2, Lock } from "lucide-react";

function Avatar({ username, size = "md" }: { username: string | null; size?: "sm" | "md" | "lg" }) {
  if (!username) {
    return (
      <div className={(size === "sm" ? "w-8 h-8" : size === "md" ? "w-10 h-10" : "w-12 h-12") + " rounded bg-surface border border-outline-variant border-dashed flex items-center justify-center shrink-0"}>
        <span className="material-symbols-outlined text-outline-variant text-[16px]">person_off</span>
      </div>
    );
  }
  const initial = username[0].toUpperCase();
  const colors = [
    "bg-violet-900 text-violet-200",
    "bg-blue-900 text-blue-200",
    "bg-emerald-900 text-emerald-200",
    "bg-amber-900 text-amber-200",
    "bg-rose-900 text-rose-200",
  ];
  const color = colors[username.charCodeAt(0) % colors.length];
  return (
    <div className={(size === "sm" ? "w-8 h-8 text-[12px]" : size === "md" ? "w-10 h-10 text-[14px]" : "w-12 h-12 text-[16px]") + " rounded bg-surface border border-outline-variant " + color + " flex items-center justify-center font-bold shadow-lg shrink-0"}>
      {initial}
    </div>
  );
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [globalLeaderboard, setGlobalLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      const [lbRes, glbRes] = await Promise.all([
        fetch(`/api/leaderboard?type=family`),
        fetch(`/api/leaderboard?type=global`)
      ]);
      
      if (lbRes.ok) {
        setLeaderboard(await lbRes.json());
      }
      if (glbRes.ok) {
        setGlobalLeaderboard(await glbRes.json());
      }
      
      setLoading(false);
    }
    fetchLeaderboard();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto page-enter px-4 md:px-8 py-8 custom-scrollbar">
      <div className="max-w-container-max mx-auto flex flex-col gap-8 md:gap-10">
        
        <header className="flex flex-col gap-4">
          <h1 className="text-3xl md:text-4xl font-headline-md font-bold text-on-surface flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[36px] bg-primary/10 p-2 rounded-2xl border border-primary/20">leaderboard</span>
            Leaderboard
          </h1>
          <p className="text-lg text-on-surface-variant font-body-lg max-w-2xl leading-relaxed">
            See how you stack up against your family and friends. Complete tasks and habits to earn XP and climb the ranks!
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Local Leaderboard Panel */}
          <div className="island-card soft-glass border-2 border-outline-variant/20 rounded-[2rem] overflow-hidden flex flex-col shadow-lg hover:border-primary/30 transition-all">
            <div className="p-6 md:p-8 border-b-2 border-outline-variant/20 bg-surface-container-high/30 flex items-center justify-between">
              <h3 className="font-headline-sm text-2xl font-bold text-on-surface flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                Family & Friends
              </h3>
            </div>
            <div className="p-4 md:p-6 flex flex-col gap-2">
              {loading ? (
                <div className="p-12 flex justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-lg"></div></div>
              ) : leaderboard.length === 0 ? (
                <div className="p-10 flex flex-col items-center justify-center opacity-50">
                   <Trophy className="w-12 h-12 text-on-surface-variant mb-4" />
                  <span className="font-headline-sm text-xl text-on-surface-variant font-bold">No Data</span>
                </div>
              ) : (
                leaderboard.map((user, idx) => (
                  <div key={user.id} className={"flex items-center gap-4 p-4 rounded-2xl transition-all group " + (idx === 0 ? 'bg-surface-variant/40 border-2 border-primary/30 shadow-md' : 'hover:bg-surface-variant/30 border-2 border-transparent hover:border-outline-variant/30')}>
                    <div className="flex flex-col items-center justify-center shrink-0 w-8">
                      {idx === 0 ? (
                        <span className="material-symbols-outlined text-primary text-[28px] icon-fill">star</span>
                      ) : (
                        <span className="font-mono-label text-sm font-bold text-on-surface-variant">0{idx + 1}</span>
                      )}
                    </div>
                    <Avatar username={user.username} size="md" />
                    <span className={"font-body-lg text-lg flex-1 truncate " + (idx === 0 ? "font-bold text-on-surface" : "font-medium text-on-surface/90")}>{user.username || 'Unknown'}</span>
                    <div className={"font-mono-label text-sm font-bold px-3 py-1.5 rounded-lg border " + (idx === 0 ? 'bg-primary/10 text-primary border-primary/20' : 'bg-surface-container-high text-on-surface-variant border-outline-variant/30')}>
                      {user.xp} XP
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Global Leaderboard */}
          <div className="island-card soft-glass border-2 border-outline-variant/20 rounded-[2rem] overflow-hidden flex flex-col shadow-lg hover:border-primary/30 transition-all min-h-[300px]">
            <div className="p-6 md:p-8 border-b-2 border-outline-variant/20 bg-surface-container-high/30 flex items-center justify-between">
              <h3 className="font-headline-sm text-2xl font-bold text-on-surface flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-outline-variant/10 flex items-center justify-center border border-outline-variant/20 shrink-0">
                  <Globe2 className="w-5 h-5 text-on-surface-variant" />
                </div>
                Global Network
              </h3>
            </div>

            <div className="p-4 md:p-6 flex flex-col gap-2">
              {loading ? (
                <div className="p-12 flex justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-lg"></div></div>
              ) : globalLeaderboard.length === 0 ? (
                <div className="p-10 flex flex-col items-center justify-center opacity-50">
                   <Globe2 className="w-12 h-12 text-on-surface-variant mb-4" />
                  <span className="font-headline-sm text-xl text-on-surface-variant font-bold">No Data</span>
                </div>
              ) : (
                globalLeaderboard.map((user, idx) => (
                  <div key={user.id} className={"flex items-center gap-4 p-4 rounded-2xl transition-all group hover:bg-surface-variant/30 border-2 border-transparent hover:border-outline-variant/30"}>
                    <div className="flex flex-col items-center justify-center shrink-0 w-8">
                        <span className={"font-mono-label text-sm font-bold " + (idx === 0 ? "text-primary text-lg" : "text-on-surface-variant")}>{idx < 9 ? '0' : ''}{idx + 1}</span>
                    </div>
                    <Avatar username={user.username} size="md" />
                    <span className={"font-body-lg text-lg flex-1 truncate font-medium text-on-surface/90"}>{user.username || 'Unknown'}</span>
                    <div className="font-mono-label text-sm font-bold px-3 py-1.5 rounded-lg border bg-surface-container-high text-on-surface-variant border-outline-variant/30">
                      {user.xp} XP
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
