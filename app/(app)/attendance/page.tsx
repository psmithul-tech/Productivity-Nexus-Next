"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";

type Subject = {
  id: number;
  name: string;
  targetPercentage: number;
  totalPresent: number;
  totalClasses: number;
  percentage: number;
};

type Log = {
  id: number;
  subjectId: number;
  status: 'present' | 'absent' | 'cancelled';
  date: string;
  subjectName: string;
};

export default function AttendanceDashboard() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [manualPresents, setManualPresents] = useState<number>(0);
  const [manualTotal, setManualTotal] = useState<number>(0);

  const fetchSubjectsAndLogs = async () => {
    try {
      const [subRes, logRes] = await Promise.all([
        fetch(`/api/attendance/subjects?_t=${Date.now()}`),
        fetch(`/api/attendance/logs?_t=${Date.now()}`)
      ]);
      
      if (subRes.ok) {
        const data = await subRes.json();
        setSubjects(data);
      }
      
      if (logRes.ok) {
        const logData = await logRes.json();
        setLogs(logData);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjectsAndLogs();
  }, []);

  const markAttendance = async (subjectId: number, status: 'present' | 'absent' | 'cancelled') => {
    try {
      await fetch("/api/attendance/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, status }),
      });
      fetchSubjectsAndLogs();
    } catch (e) {
      console.error(e);
    }
  };

  const undoLastAction = async (subjectId: number) => {
    try {
      await fetch("/api/attendance/logs/undo", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId })
      });
      fetchSubjectsAndLogs();
    } catch (e) {
      console.error(e);
    }
  };

  const saveManualEdit = async () => {
    if (!editingSubject) return;
    try {
      await fetch(`/api/attendance/subjects/${editingSubject.id}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          presents: manualPresents, 
          absents: Math.max(0, manualTotal - manualPresents) 
        }),
      });
      setEditingSubject(null);
      fetchSubjectsAndLogs();
    } catch (e) {
      console.error(e);
    }
  };

  const openEditModal = (sub: Subject) => {
    setEditingSubject(sub);
    setManualPresents(sub.totalPresent);
    setManualTotal(sub.totalClasses);
  };

  const aggregateAttendance = subjects.length > 0 
    ? (subjects.reduce((sum, sub) => sum + sub.totalPresent, 0) / Math.max(1, subjects.reduce((sum, sub) => sum + sub.totalClasses, 0))) * 100
    : 0;
  
  const totalSessions = subjects.reduce((sum, sub) => sum + sub.totalClasses, 0);
  const flaggedSubjectsCount = subjects.filter(sub => sub.percentage < sub.targetPercentage).length;
  const criticalSubject = subjects.find(sub => sub.percentage < sub.targetPercentage);

  return (
    <div className="flex-1 w-full h-full overflow-y-auto page-enter bg-background">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 md:py-12 pb-24 flex flex-col gap-8">
        
        {/* Page Header */}
        <section className="relative overflow-hidden rounded-[32px] bg-[#06D6A0] dark:bg-primary-container p-8 md:p-12 border-[3px] border-black dark:border-transparent shadow-[0_4px_0_0_#000] dark:shadow-md">
          <div className="relative z-10 max-w-2xl flex flex-col items-start">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-white dark:bg-on-primary-container/10 px-3 py-1 rounded-full text-[12px] font-bold text-black dark:text-on-primary-container uppercase tracking-widest flex items-center gap-2 border-[2px] border-black dark:border-transparent shadow-[0_2px_0_0_#000] dark:shadow-none">
                <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-primary animate-pulse"></div>
                Live Sync
              </span>
            </div>
            <h1 className="font-display-lg text-black dark:text-on-primary-container mb-2 text-4xl sm:text-5xl">Attendance Tracker</h1>
            <p className="font-body-lg text-black/80 dark:text-on-primary-container/80 mb-0 text-lg sm:text-xl">
              Monitor real-time participation metrics and academic performance across all active modules.
            </p>
          </div>
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-white/20 dark:bg-primary-container/30 rounded-full blur-3xl pointer-events-none"></div>
          <span className="material-symbols-outlined absolute right-12 top-12 text-[120px] text-on-primary-container/5 pointer-events-none rotate-12">fact_check</span>
        </section>

        {/* Alert Section */}
        {criticalSubject && (
          <div className="bg-[#EF476F]/10 dark:bg-error/5 rounded-[24px] border-[3px] border-black dark:border-error/20 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-[0_4px_0_0_#000] dark:shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-error/10 to-transparent pointer-events-none transition-opacity duration-500 opacity-50 group-hover:opacity-100"></div>
            <div className="bg-error/10 p-3 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-error text-3xl">warning</span>
            </div>
            <div className="flex-1">
              <h3 className="font-label-lg text-error uppercase tracking-widest font-bold mb-1">Threshold Warning</h3>
              <p className="font-body-md text-on-surface-variant">
                Module <span className="font-bold text-on-surface">{criticalSubject.name}</span> is approaching the critical absence limit (<span className="text-error font-bold">{Math.round(criticalSubject.percentage)}%</span>). Intervention recommended.
              </p>
            </div>
          </div>
        )}

        {/* Global Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-surface border-[3px] border-black dark:border-outline-variant/30 rounded-[32px] p-8 flex flex-col shadow-[0_4px_0_0_#000] dark:shadow-sm justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest">Aggregate</span>
                <span className="material-symbols-outlined text-primary text-2xl">monitoring</span>
              </div>
              <h3 className="font-display-lg text-on-surface text-5xl mb-2">{aggregateAttendance.toFixed(1)}%</h3>
              <p className="font-label-sm text-on-surface-variant/80 uppercase tracking-widest">Overall Attendance</p>
            </div>
            <div className="mt-8">
              <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-primary-fixed relative transition-all duration-1000" style={{ width: `\${aggregateAttendance}%` }}>
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-white/30 blur-[4px]"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-surface border-[3px] border-black dark:border-outline-variant/30 rounded-[32px] p-8 flex flex-col shadow-[0_4px_0_0_#000] dark:shadow-sm justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <span className="bg-surface-variant/50 text-on-surface-variant px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest">Sessions</span>
                <span className="material-symbols-outlined text-outline text-2xl">calendar_month</span>
              </div>
              <h3 className="font-display-lg text-on-surface text-5xl mb-2">{totalSessions}</h3>
              <p className="font-label-sm text-on-surface-variant/80 uppercase tracking-widest">Total Classes</p>
            </div>
          </div>

          <div className="bg-white dark:bg-surface border-[3px] border-black dark:border-outline-variant/30 rounded-[32px] p-8 flex flex-col shadow-[0_4px_0_0_#000] dark:shadow-sm justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <span className="bg-surface-variant/50 text-on-surface-variant px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest">Risk</span>
                <span className="material-symbols-outlined text-outline text-2xl">error</span>
              </div>
              <h3 className={`font-display-lg text-5xl mb-2 \${flaggedSubjectsCount > 0 ? 'text-error' : 'text-on-surface'}`}>{flaggedSubjectsCount}</h3>
              <p className="font-label-sm text-on-surface-variant/80 uppercase tracking-widest">Flagged Subjects</p>
            </div>
          </div>
        </section>

        {/* Subject Cards Grid */}
        <section>
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="font-headline-md text-on-surface text-2xl">Active Modules</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full py-20 flex justify-center text-primary">
                <span className="material-symbols-outlined animate-spin text-[40px]">sync</span>
              </div>
            ) : subjects.length === 0 ? (
              <div className="col-span-full rounded-[32px] p-12 text-center bg-white dark:bg-surface border-[3px] border-black dark:border-outline-variant/30 border-dashed shadow-[0_4px_0_0_#000] dark:shadow-sm">
                <span className="material-symbols-outlined text-[64px] text-on-surface-variant/50 mb-4">inventory_2</span>
                <h3 className="font-headline-sm text-on-surface mb-2">No Modules Found</h3>
                <p className="font-body-md text-on-surface-variant">Add some subjects in the Settings module to track attendance.</p>
              </div>
            ) : (
              subjects.map(sub => {
                const isWarning = sub.percentage < sub.targetPercentage;
                return (
                  <div key={sub.id} className={`bg-white dark:bg-surface border-[3px] border-black rounded-[32px] p-6 shadow-[0_4px_0_0_#000] dark:shadow-sm hover:-translate-y-[2px] transition-all hover:shadow-[0_2px_0_0_#000] dark:hover:shadow-md relative overflow-hidden flex flex-col group \${isWarning ? 'dark:border-error/30 dark:hover:border-error/50' : 'dark:border-outline-variant/30 dark:hover:border-primary/40'}`}>
                    
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div>
                        <h3 className="font-headline-sm text-on-surface mb-1 truncate max-w-[200px] leading-tight">{sub.name}</h3>
                        <p className="font-label-sm text-on-surface-variant uppercase tracking-widest">Target: {sub.targetPercentage}%</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isWarning && (
                          <div className="bg-error/10 text-error font-bold tracking-widest uppercase px-3 py-1 rounded-full text-[10px]">Risk</div>
                        )}
                        <button onClick={() => openEditModal(sub)} className="text-on-surface-variant hover:text-primary transition-colors p-1" title="Set Manually">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 relative z-10 mb-6">
                      <div className="w-24 h-24 relative flex-shrink-0">
                        <svg className="block mx-auto max-w-full max-h-full" viewBox="0 0 36 36">
                          <path className="fill-none stroke-surface-variant stroke-[3.8]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <path 
                            className={`fill-none stroke-[2.8] stroke-linecap-round transition-all duration-1000 ease-out \${isWarning ? 'stroke-error' : 'stroke-primary'}`} 
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                            strokeDasharray={`\${Math.min(100, Math.max(0, sub.totalClasses === 0 ? 100 : sub.percentage))}, 100`} 
                          />
                          <text x="18" y="20.35" className={`fill-current font-display-sm text-[8px] text-center \${isWarning ? 'text-error' : 'text-primary'}`} textAnchor="middle">
                            {sub.totalClasses === 0 ? 0 : Math.round(sub.percentage)}%
                          </text>
                        </svg>
                      </div>
                      <div className="flex-1 flex flex-col gap-3">
                        <div className="flex justify-between items-center bg-surface-container/40 px-3 py-2 rounded-xl">
                          <span className="font-label-sm text-on-surface-variant uppercase tracking-widest">Present</span>
                          <span className={`font-headline-sm \${isWarning ? 'text-on-surface' : 'text-primary'}`}>{sub.totalPresent}</span>
                        </div>
                        <div className="flex justify-between items-center bg-surface-container/40 px-3 py-2 rounded-xl">
                          <span className="font-label-sm text-on-surface-variant uppercase tracking-widest">Absent</span>
                          <span className={`font-headline-sm \${isWarning ? 'text-error' : 'text-on-surface'}`}>{sub.totalClasses - sub.totalPresent}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-auto relative z-10">
                      <button onClick={() => markAttendance(sub.id, 'present')} className="bg-primary/10 text-primary hover:bg-primary/20 hover:shadow-sm py-3 rounded-xl transition-all flex flex-col items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest">Present</span>
                      </button>
                      <button onClick={() => markAttendance(sub.id, 'absent')} className="bg-error/10 text-error hover:bg-error/20 hover:shadow-sm py-3 rounded-xl transition-all flex flex-col items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-[18px]">cancel</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest">Absent</span>
                      </button>
                      <button onClick={() => undoLastAction(sub.id)} className="bg-surface-variant/30 text-on-surface-variant hover:bg-surface-variant/60 hover:shadow-sm py-3 rounded-xl transition-all flex flex-col items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-[18px]">undo</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest">Undo</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Log Section */}
        <section>
          <div className="bg-white dark:bg-surface rounded-[32px] border-[3px] border-black dark:border-outline-variant/30 p-8 shadow-[0_4px_0_0_#000] dark:shadow-sm">
            <div className="flex justify-between items-center mb-8 border-b border-outline-variant/30 pb-4">
              <h3 className="font-headline-sm text-on-surface text-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-outline">history</span>
                Recent Activity
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-outline-variant/20">
                    <th className="font-label-sm text-on-surface-variant py-3 px-4 uppercase tracking-widest font-bold">Timestamp</th>
                    <th className="font-label-sm text-on-surface-variant py-3 px-4 uppercase tracking-widest font-bold">Module</th>
                    <th className="font-label-sm text-on-surface-variant py-3 px-4 uppercase tracking-widest font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="font-body-md">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-12 text-center text-on-surface-variant/70">
                        <div className="flex flex-col items-center gap-2">
                          <span className="material-symbols-outlined text-4xl opacity-50">receipt_long</span>
                          <span className="font-label-sm uppercase tracking-widest">No recent attendance logs</span>
                        </div>
                      </td>
                    </tr>
                  ) : logs.map((log) => (
                    <tr key={log.id} className="border-b border-outline-variant/10 hover:bg-surface-variant/20 transition-colors group">
                      <td className="py-4 px-4 text-on-surface-variant/80 font-mono text-sm whitespace-nowrap">
                        {format(new Date(log.date), "MMM dd, yyyy • HH:mm")}
                      </td>
                      <td className="py-4 px-4 text-on-surface font-bold group-hover:text-primary transition-colors">
                        {log.subjectName}
                      </td>
                      <td className="py-4 px-4">
                        {log.status === 'present' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full font-bold text-[11px] uppercase tracking-widest">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span> Present
                          </span>
                        ) : log.status === 'absent' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-error/10 text-error rounded-full font-bold text-[11px] uppercase tracking-widest">
                            <span className="material-symbols-outlined text-[14px]">cancel</span> Absent
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-surface-variant text-on-surface-variant rounded-full font-bold text-[11px] uppercase tracking-widest">
                            <span className="material-symbols-outlined text-[14px]">block</span> Cancelled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </div>

      {/* Full Screen Edit UI via Portal */}
      {editingSubject && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col bg-white/90 dark:bg-background/95 backdrop-blur-md animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto p-6 md:p-12 flex flex-col justify-center">
            
            <div className="flex items-center justify-between mb-6 md:mb-12">
              <div>
                <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-[16px]">edit_note</span> Edit Module
                </div>
                <h2 className="font-display-lg text-on-surface text-4xl sm:text-5xl md:text-6xl">{editingSubject.name}</h2>
              </div>
              <button 
                onClick={() => setEditingSubject(null)} 
                className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-surface-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-error/20 hover:text-error transition-all shrink-0"
              >
                <span className="material-symbols-outlined text-2xl md:text-3xl">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-6 md:mb-12">
              <div className="bg-white dark:bg-surface rounded-[32px] md:rounded-[48px] border-[3px] border-black dark:border-outline-variant/30 p-6 md:p-12 flex flex-col items-center justify-center gap-4 md:gap-6 group hover:-translate-y-[2px] transition-all shadow-[0_4px_0_0_#000] dark:shadow-sm hover:shadow-[0_2px_0_0_#000] dark:hover:shadow-md">
                <label className="font-label-lg text-on-surface-variant uppercase tracking-widest font-bold text-center">Attended</label>
                <input 
                  type="number" 
                  value={manualPresents} 
                  onChange={(e) => setManualPresents(parseInt(e.target.value) || 0)} 
                  min={0}
                  className="w-full text-center font-display-lg text-[80px] sm:text-[100px] md:text-[140px] leading-none bg-transparent border-none focus:outline-none focus:ring-0 text-primary placeholder:text-primary/30" 
                />
                <div className="h-1 w-24 md:w-32 bg-primary/20 rounded-full group-hover:bg-primary/50 transition-all"></div>
              </div>

              <div className="bg-white dark:bg-surface rounded-[32px] md:rounded-[48px] border-[3px] border-black dark:border-outline-variant/30 p-6 md:p-12 flex flex-col items-center justify-center gap-4 md:gap-6 group hover:-translate-y-[2px] transition-all shadow-[0_4px_0_0_#000] dark:shadow-sm hover:shadow-[0_2px_0_0_#000] dark:hover:shadow-md">
                <label className="font-label-lg text-on-surface-variant uppercase tracking-widest font-bold text-center">Total Conducted</label>
                <input 
                  type="number" 
                  value={manualTotal} 
                  onChange={(e) => setManualTotal(parseInt(e.target.value) || 0)} 
                  min={manualPresents}
                  className="w-full text-center font-display-lg text-[80px] sm:text-[100px] md:text-[140px] leading-none bg-transparent border-none focus:outline-none focus:ring-0 text-on-surface placeholder:text-on-surface/30" 
                />
                <div className="h-1 w-24 md:w-32 bg-outline-variant/50 rounded-full group-hover:bg-outline-variant transition-all"></div>
              </div>
            </div>

            <button 
              onClick={saveManualEdit}
              className="w-full h-24 rounded-[32px] bg-[#06D6A0] dark:bg-primary text-black dark:text-on-primary border-[3px] border-black dark:border-transparent font-headline-md text-2xl hover:-translate-y-[2px] shadow-[0_8px_0_0_#000] dark:shadow-lg transition-all flex items-center justify-center gap-4 hover:shadow-[0_4px_0_0_#000] dark:hover:shadow-md"
            >
              <span className="material-symbols-outlined text-[32px]">check_circle</span>
              Confirm Updates
            </button>
            
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
