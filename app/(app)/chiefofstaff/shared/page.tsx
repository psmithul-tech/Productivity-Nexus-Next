"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

type Task = {
  id: number;
  title: string;
  description?: string | null;
  status: "active" | "completed";
  priority: string;
  bucket: string;
  sharedWith: string[] | null;
  assignedTo: string | null;
  userId: string;
  dueDate?: string | null;
  createdByUsername?: string | null;
  isMyTask?: boolean;
};

type Me = { id: string; email: string };

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

export default function SharedBoardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [familyInfo, setFamilyInfo] = useState<{ family: any; members: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);
  const [myUsername, setMyUsername] = useState<string | null>(null);
  const [newFamilyName, setNewFamilyName] = useState("");
  const [newMemberUsername, setNewMemberUsername] = useState("");

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setMe({ id: user.id, email: user.email! });

      const settingsRes = await fetch("/api/settings");
      if (settingsRes.ok) {
        const s = await settingsRes.json();
        if (s.username) setMyUsername(s.username);
      }
      
      await loadFamily();
      await fetchLeaderboard();
      await fetchTasks();
    }
    init();
  }, []);

  async function loadFamily() {
    const famRes = await fetch("/api/family");
    if (famRes.ok) {
      const famData = await famRes.json();
      if (famData.family) setFamilyInfo(famData);
      else setFamilyInfo(null);
    }
  }

  const fetchLeaderboard = async () => {
    // Moved to leaderboard page
  };

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks/shared");
      if (!res.ok) throw new Error();
      setTasks(await res.json());
    } catch {
      toast.error("Could not load network operations");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleComplete = useCallback(async (task: Task) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: t.status === "completed" ? "active" : "completed" } : t));
    try {
      if (task.status === "active") {
        await fetch(`/api/tasks/\${task.id}/complete`, { method: "PATCH" });
      } else {
        await fetch(`/api/tasks/\${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "active", completedAt: null }),
        });
      }
    } catch {
      toast.error("Failed to update operation");
      fetchTasks();
    }
  }, [fetchTasks]);

  const handleClaim = useCallback(async (task: Task) => {
    if (!myUsername) {
      toast.error("Configure local node username in Settings first");
      return;
    }
    const newAssignedTo = task.assignedTo === myUsername ? null : myUsername;
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, assignedTo: newAssignedTo } : t));
    try {
      await fetch(`/api/tasks/\${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo: newAssignedTo }),
      });
    } catch {
      toast.error("Failed to update operation allocation");
      fetchTasks();
    }
  }, [myUsername, fetchTasks]);

  const handleCreateFamily = async () => {
    if (!newFamilyName.trim()) return;
    try {
      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFamilyName.trim() }),
      });
      if (res.ok) {
        toast.success("Network cluster initialized");
        await loadFamily();
        setNewFamilyName("");
      } else {
        toast.error((await res.json()).error);
      }
    } catch {
      toast.error("Failed to initialize cluster");
    }
  };

  const handleAddMember = async () => {
    if (!newMemberUsername.trim()) return;
    try {
      const res = await fetch("/api/family/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newMemberUsername.trim() }),
      });
      if (res.ok) {
        toast.success("Node authorized");
        setNewMemberUsername("");
        await loadFamily();
      } else {
        toast.error((await res.json()).error);
      }
    } catch {
      toast.error("Failed to authorize node");
    }
  };

  const activeTasks = tasks.filter(t => t.status === "active");
  const completedTasks = tasks.filter(t => t.status === "completed");

  const amAdmin = familyInfo?.members.find((m: any) => m.userId === me?.id)?.role === "admin";

  return (
    <div className="flex-1 overflow-y-auto page-enter px-4 md:px-lg py-8 custom-scrollbar">
      <div className="max-w-container-max mx-auto flex flex-col gap-8 md:gap-12">
          
          {/* Hero Section: Network Uplink (Join/Create) */}
          <section className="bg-white dark:bg-surface border-[3px] border-black dark:border-transparent rounded-[32px] p-6 md:p-10 relative overflow-hidden shadow-[0_4px_0_0_#000] dark:shadow-lg">
            <div className="absolute top-0 left-0 w-4 h-full bg-primary rounded-l-[32px] border-r-[3px] border-black dark:border-transparent"></div>
            <div className="flex flex-col lg:flex-row items-center gap-8 justify-between relative z-10 pl-4 md:pl-6">
              <div className="flex-1 text-center lg:text-left">
                <h1 className="font-headline-md text-3xl md:text-4xl text-on-surface mb-3 flex items-center justify-center lg:justify-start gap-3 font-bold tracking-tight">
                  <span className="material-symbols-outlined text-black dark:text-primary text-[36px] bg-white dark:bg-primary/10 p-2 rounded-2xl border-[3px] border-black dark:border-primary/20 shadow-[0_2px_0_0_#000] dark:shadow-none">hub</span>
                  {familyInfo ? familyInfo.family.name : "Create your Family Board"}
                </h1>
                <p className="font-body-lg text-lg text-on-surface-variant max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  {familyInfo 
                    ? "Family board is online. Let's get things done together."
                    : "Create a new family board or join an existing one to share tasks and stay connected."}
                </p>
              </div>
              
              {!familyInfo && (
                <div className="w-full lg:w-auto bg-[#F0F4F8] dark:bg-surface-container-lowest border-[3px] border-black dark:border-outline-variant/30 rounded-2xl p-2 flex items-center shadow-inner">
                  <span className="material-symbols-outlined text-primary mx-3 text-[24px]">key</span>
                  <input 
                    value={newFamilyName}
                    onChange={(e) => setNewFamilyName(e.target.value)}
                    className="bg-transparent border-none text-on-surface font-body-lg text-lg focus:ring-0 w-full lg:w-64 placeholder-on-surface-variant/50 outline-none" 
                    placeholder="Enter Family Name" 
                    type="text"
                  />
                  <button 
                    onClick={handleCreateFamily}
                    className="ml-2 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#06D6A0] dark:bg-primary text-black dark:text-on-primary font-mono-label text-sm font-bold uppercase tracking-widest border-[3px] border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-md hover:-translate-y-[2px] transition-all whitespace-nowrap"
                  >
                    Create
                  </button>
                </div>
              )}
              {familyInfo && amAdmin && (
                <div className="w-full lg:w-auto bg-[#F0F4F8] dark:bg-surface-container-lowest border-[3px] border-black dark:border-outline-variant/30 rounded-2xl p-2 flex items-center shadow-inner">
                  <span className="material-symbols-outlined text-primary mx-3 text-[24px]">person_add</span>
                  <input 
                    value={newMemberUsername}
                    onChange={(e) => setNewMemberUsername(e.target.value)}
                    className="bg-transparent border-none text-on-surface font-body-lg text-lg focus:ring-0 w-full lg:w-64 placeholder-on-surface-variant/50 outline-none" 
                    placeholder="Enter Username" 
                    type="text"
                  />
                  <button 
                    onClick={handleAddMember}
                    className="ml-2 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#06D6A0] dark:bg-primary text-black dark:text-on-primary font-mono-label text-sm font-bold uppercase tracking-widest border-[3px] border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-md hover:-translate-y-[2px] transition-all whitespace-nowrap"
                  >
                    Add Member
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Active Nodes (Members) */}
          {familyInfo && (
            <section className="flex flex-col gap-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="font-headline-sm text-2xl text-on-surface font-bold flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)] animate-pulse"></div>
                  Family & Friends
                </h2>
                <span className="font-mono-label text-xs font-bold uppercase tracking-widest text-on-surface-variant bg-surface-container-high px-4 py-1.5 rounded-full border border-outline-variant/30 shadow-sm">{familyInfo.members.length} Members</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {familyInfo.members.map((m, idx) => (
                  <div key={m.id} className="bg-white dark:bg-surface-container-lowest border-[3px] border-black dark:border-outline-variant/20 rounded-[32px] p-6 hover:border-black dark:hover:border-primary/50 transition-all group relative overflow-hidden shadow-[0_4px_0_0_#000] dark:shadow-sm hover:-translate-y-1 hover:shadow-[0_6px_0_0_#000] dark:hover:shadow-md">
                    <div className="flex items-center gap-5 relative z-10">
                      <Avatar username={m.username} size="lg" />
                      <div className="flex flex-col">
                        <span className="font-headline-sm text-xl text-on-surface truncate font-bold">{m.username || 'Unknown'}</span>
                        <span className={`font-mono-label text-[10px] font-bold uppercase tracking-widest mt-1 ${m.role === 'admin' ? 'text-primary' : 'text-on-surface-variant'}`}>{m.role === 'admin' ? 'Admin' : 'Member'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Shared Operations (Tasks) */}
          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="font-headline-sm text-2xl text-on-surface font-bold flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-[28px]">format_list_bulleted</span>
                Shared Tasks
              </h2>
            </div>
            
            <div className="bg-white dark:bg-surface-container-lowest border-[3px] border-black dark:border-outline-variant/20 rounded-[32px] flex flex-col overflow-hidden shadow-[0_4px_0_0_#000] dark:shadow-sm">
              {/* Header Row */}
              <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 p-4 border-b-[3px] border-black dark:border-outline-variant/20 bg-[#F0F4F8] dark:bg-surface-container-low/50 font-mono-label text-xs font-bold text-black dark:text-on-surface-variant uppercase tracking-widest">
                <div className="w-12 text-center">Sts</div>
                <div>Task Name</div>
                <div className="w-28 text-right">Assignee</div>
                <div className="w-24 text-right pr-4">Action</div>
              </div>

              {loading ? (
                <div className="p-12 flex justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-lg"></div></div>
              ) : activeTasks.length === 0 && completedTasks.length === 0 ? (
                <div className="p-16 flex flex-col items-center justify-center opacity-50">
                  <span className="material-symbols-outlined text-5xl mb-4 text-on-surface-variant">check_circle</span>
                  <span className="font-headline-sm text-xl text-on-surface-variant font-bold">No tasks found</span>
                </div>
              ) : (
                <div className="flex flex-col p-2 gap-2">
                  {activeTasks.map(task => (
                    <div key={task.id} className="grid grid-cols-[auto_1fr_auto_auto] gap-4 p-4 items-center rounded-xl hover:bg-surface-variant/30 transition-all group cursor-pointer border-[2px] border-transparent hover:border-black dark:hover:border-primary/20">
                      <div className="w-12 flex justify-center" onClick={() => handleComplete(task)}>
                        <button className="w-6 h-6 rounded-lg border-[2px] border-black dark:border-outline-variant group-hover:border-black dark:group-hover:border-primary group-hover:bg-[#FFD166] dark:group-hover:bg-primary/10 transition-colors flex items-center justify-center shrink-0"></button>
                      </div>
                      <div className="flex flex-col min-w-0 justify-center">
                        <span className="font-body-lg text-lg text-on-surface truncate font-medium">{task.title}</span>
                        {task.priority === 'urgent' && <span className="font-mono-label text-[10px] font-bold text-error uppercase tracking-widest mt-1 bg-error/10 px-2 py-0.5 rounded w-fit">Urgent Priority</span>}
                      </div>
                      <div className="w-28 flex items-center justify-end">
                        <div className="bg-surface-container-high px-3 py-1.5 rounded-lg border border-outline-variant/30 font-mono-label text-[10px] font-bold text-on-surface-variant truncate max-w-full text-center">
                          {task.assignedTo || 'Unassigned'}
                        </div>
                      </div>
                      <div className="w-24 flex items-center justify-end pr-2">
                        <button onClick={() => handleClaim(task)} className={`font-mono-label text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border-[2px] transition-all shadow-[0_2px_0_0_#000] dark:shadow-none hover:-translate-y-[2px] ${task.assignedTo === myUsername ? 'bg-white dark:bg-surface-container text-black dark:text-on-surface-variant border-black dark:border-outline-variant/30 hover:bg-gray-50 dark:hover:bg-surface-variant' : 'bg-[#EF476F] dark:bg-primary/10 text-white dark:text-primary border-black dark:border-primary/30 hover:bg-[#D81B60] dark:hover:bg-primary dark:hover:text-on-primary'}`}>
                          {task.assignedTo === myUsername ? 'Unclaim' : 'Claim'}
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {completedTasks.length > 0 && activeTasks.length > 0 && (
                     <div className="h-px bg-outline-variant/20 mx-4 my-2"></div>
                  )}

                  {completedTasks.map(task => (
                    <div key={task.id} className="grid grid-cols-[auto_1fr_auto_auto] gap-4 p-4 items-center rounded-xl hover:bg-surface-variant/20 transition-all group cursor-pointer border-[2px] border-transparent opacity-60 grayscale hover:grayscale-0">
                      <div className="w-12 flex justify-center" onClick={() => handleComplete(task)}>
                        <button className="w-6 h-6 rounded-lg border-[2px] border-black dark:border-primary bg-black dark:bg-primary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[16px] text-white dark:text-on-primary">check</span>
                        </button>
                      </div>
                      <div className="flex flex-col min-w-0 justify-center">
                        <span className="font-body-lg text-lg text-outline-variant line-through truncate font-medium">{task.title}</span>
                      </div>
                      <div className="w-28 flex items-center justify-end">
                        <div className="bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/20 font-mono-label text-[10px] font-bold text-outline-variant truncate max-w-full text-center">
                          {task.assignedTo || 'Unassigned'}
                        </div>
                      </div>
                      <div className="w-24 flex items-center justify-end pr-2">
                        <div className="font-mono-label text-[10px] font-bold uppercase tracking-widest text-primary/70 bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10">
                          Done
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

      </div>
    </div>
  );
}
