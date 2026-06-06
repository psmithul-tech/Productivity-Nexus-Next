"use client";
import { useEffect, useState } from "react";

type Subject = {
  id: number;
  name: string;
  targetPercentage: number;
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [name, setName] = useState("");
  const [target, setTarget] = useState(75);
  const [loading, setLoading] = useState(false);

  const fetchSubjects = async () => {
    try {
      const res = await fetch(`/api/attendance/subjects?_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setSubjects(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const addSubject = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/attendance/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, targetPercentage: target }),
      });
      setName("");
      setTarget(75);
      fetchSubjects();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const deleteSubject = async (id: number) => {
    if (!confirm("Are you sure you want to delete this subject and all its attendance records?")) return;
    try {
      const res = await fetch(`/api/attendance/subjects/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(`Failed to delete: ${data.error || res.statusText}`);
      }
      fetchSubjects();
    } catch (e) {
      console.error(e);
      alert("An error occurred while deleting the subject.");
    }
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto page-enter bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 md:py-12 pb-24 flex flex-col gap-8">
        
        {/* Header */}
        <section className="relative overflow-hidden rounded-[32px] bg-[#118AB2] dark:bg-primary-container p-8 md:p-12 border-[3px] border-black dark:border-transparent shadow-[0_4px_0_0_#000] dark:shadow-md">
          <div className="relative z-10 max-w-2xl flex flex-col items-start">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-white dark:bg-on-primary-container/10 px-3 py-1 rounded-full text-[12px] font-bold text-black dark:text-on-primary-container uppercase tracking-widest flex items-center gap-2 border-[2px] border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-none">
                Settings
              </span>
            </div>
            <h1 className="font-display-lg text-black dark:text-on-primary-container mb-2 text-4xl sm:text-5xl">Module Setup</h1>
            <p className="font-body-lg text-black/80 dark:text-on-primary-container/80 mb-0 text-lg sm:text-xl">
              Configure parameters and tracking goals for your academic modules.
            </p>
          </div>
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-white/20 dark:bg-primary-container/30 rounded-full blur-3xl pointer-events-none"></div>
          <span className="material-symbols-outlined absolute right-12 top-12 text-[120px] text-on-primary-container/5 pointer-events-none rotate-12">school</span>
        </section>

        {/* Add New Subject */}
        <section className="bg-white dark:bg-surface rounded-[32px] border-[3px] border-black dark:border-outline-variant/30 p-8 shadow-[0_4px_0_0_#000] dark:shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <span className="material-symbols-outlined text-[120px]">add_task</span>
          </div>
          <h3 className="font-headline-sm text-on-surface text-xl flex items-center gap-2 mb-6 relative z-10">
            <span className="material-symbols-outlined text-primary">add_circle</span> Initialize New Module
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 items-end relative z-10">
            <div className="flex-1 w-full">
              <label className="font-label-sm text-on-surface-variant uppercase tracking-widest mb-2 block font-bold">Module Designation</label>
              <input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g. Data Structures" 
                className="flex h-12 w-full rounded-xl border-[2px] border-black dark:border-outline-variant/50 px-4 py-2 font-body-md bg-[#F0F4F8] dark:bg-surface-container text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all" 
              />
            </div>
            <div className="w-full sm:w-32">
              <label className="font-label-sm text-on-surface-variant uppercase tracking-widest mb-2 block font-bold">Target %</label>
              <input 
                type="number" 
                value={target} 
                onChange={(e) => setTarget(parseInt(e.target.value) || 75)} 
                min={1} 
                max={100} 
                className="flex h-12 w-full rounded-xl border-[2px] border-black dark:border-outline-variant/50 px-4 py-2 font-body-md bg-[#F0F4F8] dark:bg-surface-container text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all" 
              />
            </div>
            <button 
              onClick={addSubject} 
              disabled={loading || !name.trim()} 
              className="h-12 px-8 rounded-xl bg-white dark:bg-primary text-black dark:text-on-primary border-[3px] border-black dark:border-transparent font-label-md uppercase tracking-widest shadow-[0_4px_0_0_#000] dark:shadow-none hover:-translate-y-[2px] hover:shadow-[0_4px_0_0_#000] dark:hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              <span className="material-symbols-outlined text-[18px]">add</span> Add
            </button>
          </div>
        </section>

        {/* Subjects List */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map(sub => (
            <div key={sub.id} className="bg-white dark:bg-surface rounded-[24px] border-[3px] border-black dark:border-outline-variant/20 p-6 flex items-center justify-between group shadow-[0_4px_0_0_#000] dark:shadow-sm hover:-translate-y-[2px] hover:shadow-[0_6px_0_0_#000] dark:hover:shadow-md transition-all">
              <div>
                <h4 className="text-on-surface font-headline-sm mb-1 group-hover:text-primary transition-colors">{sub.name}</h4>
                <p className="font-label-sm text-on-surface-variant uppercase tracking-widest">
                  Target Threshold: <span className="text-primary font-bold">{sub.targetPercentage}%</span>
                </p>
              </div>
              <button 
                onClick={() => deleteSubject(sub.id)}
                className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 rounded-full transition-colors"
                title="Delete Subject"
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </div>
          ))}
          {subjects.length === 0 && (
            <div className="col-span-full bg-white dark:bg-surface rounded-[32px] border-[3px] border-black dark:border-outline-variant/30 border-dashed p-12 text-center flex flex-col items-center shadow-[0_4px_0_0_#000] dark:shadow-sm">
              <span className="material-symbols-outlined text-[64px] text-on-surface-variant/50 mb-4">folder_off</span>
              <p className="font-label-md text-on-surface-variant uppercase tracking-widest">No modules defined in current parameters.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
